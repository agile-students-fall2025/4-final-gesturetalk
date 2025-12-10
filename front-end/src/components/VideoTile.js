// src/components/VideoTile.js
import React, { useEffect, useRef, useState, useContext } from "react";
import * as tf from "@tensorflow/tfjs";
import UserContext from "../contexts/UserContext";

const DEFAULT_PROFILE_IMAGE = `${process.env.PUBLIC_URL || ""}/defaultPFP.png`;

// =========================
//  MediaPipe loader (CDN)
// =========================
const MP_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js",
];

function loadMediapipeFromCDN() {
  if (!window.__mpHandsPromise) {
    window.__mpHandsPromise = Promise.all(
      MP_SCRIPTS.map(
        (src) =>
          new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = (e) => reject(e);
            document.body.appendChild(s);
          })
      )
    ).then(() => {
      const Hands = window.Hands;
      const Camera = window.Camera;
      const { drawConnectors, drawLandmarks } = window;

      if (!Hands || !Camera || !drawConnectors || !drawLandmarks) {
        throw new Error("MediaPipe Hands globals not found after loading.");
      }
      return { Hands, Camera, drawConnectors, drawLandmarks };
    });
  }
  return window.__mpHandsPromise;
}

function getGlobalHands(HandsCtor) {
  if (!window.__aslHandsInstance) {
    window.__aslHandsInstance = new HandsCtor({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
    });
  }
  const hands = window.__aslHandsInstance;
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
    selfieMode: false,
  });
  return hands;
}

// =========================
//  ASL model globals
// =========================
let ASLModel = null;
let ASLLabels = null;
let aslLoadingPromise = null;

async function loadASLModel() {
  if (!aslLoadingPromise) {
    aslLoadingPromise = (async () => {
      const model = await tf.loadLayersModel("/asl_model/model.json");
      const labelsResp = await fetch("/asl_model/labels.json");
      const labels = await labelsResp.json();
      ASLModel = model;
      ASLLabels = labels;
      console.log("✅ ASL model + labels loaded", labels);
    })();
  }
  return aslLoadingPromise;
}

// =========================
//  Shared constants
// =========================
const SEQ_LENGTH = 30;
const HAND_DIM = 126; // 63 left + 63 right

// Match script.js smoothing logic
const CONF_THRESHOLD = 0.7;
const PRED_WINDOW = 30;

// Majority vote helper (same idea as script.js)
function majorityVote(arr) {
  const counts = {};
  arr.forEach((l) => {
    counts[l] = (counts[l] || 0) + 1;
  });
  let best = null;
  let bestCount = 0;
  Object.entries(counts).forEach(([label, count]) => {
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  });
  return best;
}

// =========================
//  Hook: ASL from video
// =========================

/*
  // Helper to draw prediction text on the overlay canvas
function drawPredictionText(ctx, canvas, text) {
    if (!ctx || !canvas) return;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, 350, 45);

    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText(`Prediction: ${text}`, 10, 32);
    ctx.restore();
}
*/

function useASLFromVideo({
  videoEl,
  canvasEl,
  enabled,
  onGesture,
  onNoHandsDetected,
}) {
  const ctxRef = useRef(null);
  const seqRef = useRef([]); // sequence of 30 frames
  const predictionHistoryRef = useRef([]); // recent confident labels
  const currentLabelRef = useRef(""); // smoothed label
  const frameReqRef = useRef(null);
  const processingRef = useRef(false);
  const noHandsTimerRef = useRef(null);
  const removeLoadedListenerRef = useRef(null);
  const hiddenCanvasRef = useRef(null); // hidden canvas for raw processing

  // Feature extraction: same as script.js
  function extractHandFeatures(results) {
    // 21 landmarks * 3 coords = 63 per hand
    let left = new Array(63).fill(0);
    let right = new Array(63).fill(0);

    const handsLms = results.multiHandLandmarks;
    const handedness = results.multiHandedness;

    if (handsLms && handedness) {
      handsLms.forEach((hand, idx) => {
        const side = handedness[idx].label; // "Left" or "Right"

        // Wrist-centered: subtract wrist (landmark 0) from all points
        const wrist = hand[0];
        const centeredFlat = hand.flatMap((lm) => [
          lm.x - wrist.x,
          lm.y - wrist.y,
          lm.z - wrist.z,
        ]); // length 63

        if (side === "Left") {
          left = centeredFlat;
        } else if (side === "Right") {
          right = centeredFlat;
        }
      });
    }

    const frame = left.concat(right); // 126-dim
    return frame.map((v) => (Number.isFinite(v) ? v : 0));
  }


  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!enabled || !videoEl) return;

      await Promise.all([loadMediapipeFromCDN(), loadASLModel()]);
      if (cancelled) return;

      const { Hands, drawConnectors, drawLandmarks } =
        await loadMediapipeFromCDN();

      if (canvasEl) {
        ctxRef.current = canvasEl.getContext("2d");
      }

      // Hidden canvas for non-mirrored processing
      if (!hiddenCanvasRef.current) {
        hiddenCanvasRef.current = document.createElement("canvas");
      }
      const hiddenCanvas = hiddenCanvasRef.current;
      const hiddenCtx = hiddenCanvas.getContext("2d");

      const hands = getGlobalHands(Hands);

      hands.onResults((results) => {
        if (cancelled) return;
        const ctx = ctxRef.current;
        if (!ctx || !canvasEl) return;

        const w = videoEl.videoWidth || 640;
        const h = videoEl.videoHeight || 480;
        if (canvasEl.width !== w) canvasEl.width = w;
        if (canvasEl.height !== h) canvasEl.height = h;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        const hasHands =
          results.multiHandLandmarks &&
          results.multiHandLandmarks.length > 0;

        // Draw hand landmarks on overlay
        if (hasHands) {
          for (const lm of results.multiHandLandmarks) {
            drawConnectors(ctx, lm, window.HAND_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 3,
            });
            drawLandmarks(ctx, lm, {
              color: "#FF0000",
              lineWidth: 1,
            });
          }
        }
        ctx.restore();

        // === No-hands timer for auto-translate (kept same as before) ===
        if (!hasHands) {
          if (!noHandsTimerRef.current) {
            noHandsTimerRef.current = setTimeout(() => {
              if (typeof onNoHandsDetected === "function") {
                onNoHandsDetected();
              }
              noHandsTimerRef.current = null;
            }, 2000);
          }
        } else if (noHandsTimerRef.current) {
          clearTimeout(noHandsTimerRef.current);
          noHandsTimerRef.current = null;
        }

        // === Sequence + model logic aligned with script.js ===

        // Always extract features; if no hands, this returns zeros
        const features = extractHandFeatures(results);

        const seq = seqRef.current;
        seq.push(features);
        if (seq.length > SEQ_LENGTH) seq.shift();

        // If model not ready
        if (!ASLModel || !ASLLabels) {
          console.warn("ASL model or labels not loaded yet.");
          return;
        }

        // Wait until we have a full 30-frame window
        if (seq.length < SEQ_LENGTH) {
          return;
        }


        // shape [1, 30, 126] like script.js: tf.tensor3d([sequence], ...)
        const input = tf.tensor3d([seq], [1, SEQ_LENGTH, HAND_DIM]);

        let maxProb = 0;
        let predLabel = "";
        try {
          const logits = ASLModel.predict(input);
          const probs = Array.from(logits.dataSync());

          maxProb = Math.max(...probs);
          const predIdx = probs.indexOf(maxProb);
          predLabel = ASLLabels[predIdx];

          logits.dispose();
        } catch (e) {
          console.error("ASL predict error:", e);
        } finally {
          input.dispose();
        }

        // Update prediction history only if confident enough (>= 0.7)
        if (maxProb >= CONF_THRESHOLD && predLabel) {
          const hist = predictionHistoryRef.current;
          hist.push(predLabel);
          if (hist.length > PRED_WINDOW) {
            hist.shift();
          }

          const majority = majorityVote(hist);
          if (majority) {
            currentLabelRef.current = majority;
          }
        }

        // Call onGesture with smoothed label + current prob
        if (
          typeof onGesture === "function" &&
          currentLabelRef.current &&
          maxProb > 0
        ) {
          onGesture({
            label: currentLabelRef.current,
            score: maxProb,
            source: "asl",
          });
        }
      });

      const startLoop = () => {
        if (!videoEl) return;
        if (frameReqRef.current) {
          cancelAnimationFrame(frameReqRef.current);
        }

        const loop = () => {
          if (cancelled) return;

          if (!processingRef.current && videoEl.readyState >= 2) {
            processingRef.current = true;

            const w = videoEl.videoWidth || 640;
            const h = videoEl.videoHeight || 480;
            hiddenCanvas.width = w;
            hiddenCanvas.height = h;

            // Draw raw (non-mirrored) video to hidden canvas
            hiddenCtx.drawImage(videoEl, 0, 0, w, h);

            // Send the raw canvas image to MediaPipe
            hands
              .send({ image: hiddenCanvas })
              .catch((err) => console.error("MediaPipe send error:", err))
              .finally(() => {
                processingRef.current = false;
              });
          }

          if (!cancelled) {
            frameReqRef.current = requestAnimationFrame(loop);
          }
        };

        loop();
      };

      if (videoEl?.readyState >= 2) {
        startLoop();
      } else if (videoEl) {
        const onLoadedData = () => {
          if (cancelled) return;
          videoEl.removeEventListener("loadeddata", onLoadedData);
          removeLoadedListenerRef.current = null;
          startLoop();
        };
        removeLoadedListenerRef.current = () => {
          videoEl.removeEventListener("loadeddata", onLoadedData);
        };
        videoEl.addEventListener("loadeddata", onLoadedData);
      }
    }

    if (enabled) {
      init();
    }

    return () => {
      cancelled = true;

      // Reset buffers
      seqRef.current = [];
      predictionHistoryRef.current = [];
      currentLabelRef.current = "";

      if (noHandsTimerRef.current) {
        clearTimeout(noHandsTimerRef.current);
        noHandsTimerRef.current = null;
      }

      if (frameReqRef.current) {
        cancelAnimationFrame(frameReqRef.current);
        frameReqRef.current = null;
      }
      processingRef.current = false;

      if (removeLoadedListenerRef.current) {
        removeLoadedListenerRef.current();
        removeLoadedListenerRef.current = null;
      }

      hiddenCanvasRef.current = null;
      ctxRef.current = null;
    };
  }, [enabled, videoEl, canvasEl, onGesture, onNoHandsDetected]);
}

// ========= Simple placeholder icon =========
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="5" />
      <path d="M3 22a9 9 0 0 1 18 0" />
    </svg>
  );
}

// ========= Main VideoTile component =========
export default function VideoTile(props) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState(null);
  const { currentUser } = useContext(UserContext);
  const profileImage =
    props.picture && props.picture.trim()
      ? props.picture
      : DEFAULT_PROFILE_IMAGE;

  const [signedWords, setSignedWords] = useState([]);
  const [translatedSentence, setTranslatedSentence] = useState("");
  const [translating, setTranslating] = useState(false);
  const lastLockedWordRef = useRef(null);

  // Auto-translate when no hands detected for 2s
  const handleNoHandsDetected = async () => {
    if (!signedWords.length || translating) return;

    console.log("⏱️ No hands detected for 2s, auto-translating:", signedWords);

    setTranslating(true);
    setTranslatedSentence("");
    const token = localStorage.getItem("authToken");

    let userName =
      currentUser?.name ||
      currentUser?.username ||
      (currentUser?.email
        ? currentUser.email.split("@")[0]
        : null);

    let userId = currentUser?._id || currentUser?.id;

    if (!userName || !userId) {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          userName =
            userName ||
            parsed.name ||
            parsed.username ||
            (parsed.email ? parsed.email.split("@")[0] : null);
          userId = userId || parsed._id || parsed.id;
        } catch (e) {
          console.warn("Failed to parse currentUser from localStorage", e);
        }
      }
    }

    if (!userName) userName = "Anonymous";

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/translate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            signedWords,
            meetingId: props.meetingId,
            userId,
            userName,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Translation failed");
      }

      setTranslatedSentence(data.sentence);

      if (typeof props.onTranslatedSentence === "function") {
        props.onTranslatedSentence(data.sentence);
      }

      setSignedWords([]);
      lastLockedWordRef.current = null;

      setTimeout(() => {
        setTranslatedSentence("");
      }, 3000);
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setTranslating(false);
    }
  };

  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    if (props.cameraOn !== undefined) {
      setCameraOn(props.cameraOn);
    }
  }, [props.cameraOn]);

  useEffect(() => {
    if (props.cameraOn !== undefined) {
      return;
    }

    if (!props.stream || !(props.stream instanceof MediaStream)) {
      return;
    }

    const videoTrack = props.stream.getVideoTracks()[0];
    if (!videoTrack) {
      return;
    }

    setCameraOn(videoTrack.enabled);

    const checkInterval = setInterval(() => {
      setCameraOn(videoTrack.enabled);
    }, 200);

    return () => clearInterval(checkInterval);
  }, [props.cameraOn, props.stream]);

  useEffect(() => {
    if (!videoRef.current) return;
    const hasStream = props.stream instanceof MediaStream;

    if (hasStream) {
      if (videoRef.current.srcObject !== props.stream) {
        videoRef.current.srcObject = props.stream;
      }
    } else {
      videoRef.current.srcObject = null;
    }
  }, [props.stream, cameraOn, props.badgeText]);



  useASLFromVideo({
    videoEl: videoRef.current,
    canvasEl: canvasRef.current,
    enabled: !!props.gestureOn && !!props.isLocal,
    onGesture: (g) => {
      setGesture(g);

      // Keep existing "word locking" behavior
      if (g.score > 0.8 && g.label !== lastLockedWordRef.current) {
        lastLockedWordRef.current = g.label;
        setSignedWords((prev) => [...prev, g.label]);
      }
    },
    onNoHandsDetected: handleNoHandsDetected,
  });

  const hasStream = props.stream instanceof MediaStream;
  const showBadge =
    typeof props.badgeText === "string" && props.badgeText.trim().length > 0;

  return (
    <div className="tile" style={{ position: "relative" }}>
      {props.isLocal && (
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            zIndex: 5,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 10,
            fontSize: 12,
            maxWidth: "60%",
          }}
        >
          <div>
            <strong>Signed words:</strong>{" "}
            {signedWords.length ? signedWords.join(" ") : "—"}
          </div>
          {translating && (
            <div style={{ marginTop: 4, color: "#ffdd00" }}>
              Translating...
            </div>
          )}
          {translatedSentence && (
            <div style={{ marginTop: 4 }}>
              <strong>Sentence:</strong> {translatedSentence}
            </div>
          )}
        </div>
      )}

      {showBadge && (
        <div className={"tile-badge " + (props.badgeClass || "")}>
          {props.badgeText}
        </div>
      )}

      {gesture && props.gestureOn && (
        <div
          className="tile-gesture-hud"
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            zIndex: 3,
            background: "rgba(0,0,0,.55)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          ASL: {gesture.label} {(gesture.score * 100).toFixed(0)}%
        </div>
      )}

      <div className="tile-media">
        {hasStream && cameraOn ? (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted={!!props.isLocal}
              className="tile-video"
              style={{ transform: props.isLocal ? "scaleX(-1)" : "none" }}
            />
            <canvas
              ref={canvasRef}
              className="tile-overlay"
              style={{
                opacity: props.gestureOn ? 1 : 0,
                transform: props.isLocal ? "scaleX(-1)" : "none",
                pointerEvents: "none",
              }}
              width={640}
              height={480}
            />
          </>
        ) : hasStream && !cameraOn ? (
          <div
            className="placeholder placeholder-profile"
            style={{
              backgroundImage: `url("${profileImage}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="placeholder-gloss" />
            <div className="placeholder-avatar">
              <img
                src={profileImage}
                alt="Profile"
                onError={(e) => {
                  if (e.currentTarget.src !== DEFAULT_PROFILE_IMAGE) {
                    e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div className="placeholder">
            <IconUser />
          </div>
        )}
      </div>
    </div>
  );
}
