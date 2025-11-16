// src/components/VideoTile.js
import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";

// ========= MediaPipe globals (lazy-loaded) =========
let FilesetResolver;
let GestureRecognizer;
let DrawingUtils;
let mpLoadingPromise = null;

async function loadTasksVision() {
  if (!mpLoadingPromise) {
    mpLoadingPromise = import("@mediapipe/tasks-vision").then((mod) => {
      FilesetResolver = mod.FilesetResolver;
      GestureRecognizer = mod.GestureRecognizer;
      DrawingUtils = mod.DrawingUtils;
      return mod;
    });
  }
  return mpLoadingPromise;
}

// ========= ASL model globals (lazy-loaded) =========
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

// ========= Small helpers =========
function flattenLandmarks21(lms) {
  // lms: array of 21 {x,y,z}
  const out = new Array(63).fill(0);
  if (!lms || !lms.length) return out;
  const n = Math.min(21, lms.length);
  for (let i = 0; i < n; i++) {
    const p = lms[i];
    const base = i * 3;
    out[base] = p.x;
    out[base + 1] = p.y;
    out[base + 2] = p.z ?? 0;
  }
  return out;
}

// ========== Hook: read gestures from <video>, draw on <canvas>, call onGesture() ==========
function useReadGestureFromVideo({
  videoEl,
  canvasEl,
  enabled,
  onGesture,
  googleMinScore = 0.75,
  aslMinScore = 0.80,
  smoothWindow = 5,
}) {
  const recRef = useRef(null);
  const frameRef = useRef(null);
  const ctxRef = useRef(null);
  const drawerRef = useRef(null);

  // For smoothing whichever final label we output
  const historyRef = useRef([]);

  // For ASL: 30-frame ring buffer of 126-dim features
  const seqRef = useRef([]);

  // Majority vote + average score over last N frames
  function pushAndSmooth(label, score) {
    const buf = historyRef.current;
    buf.push({ label, score });
    if (buf.length > smoothWindow) buf.shift();

    const counts = new Map();
    for (const item of buf) {
      counts.set(item.label, (counts.get(item.label) || 0) + 1);
    }
    let bestLabel = null;
    let bestCount = -1;
    counts.forEach((c, k) => {
      if (c > bestCount) {
        bestCount = c;
        bestLabel = k;
      }
    });
    const subset = buf.filter((x) => x.label === bestLabel);
    const avgScore =
      subset.reduce((acc, x) => acc + x.score, 0) /
      Math.max(1, subset.length);
    return { label: bestLabel, score: avgScore };
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!enabled || !videoEl) return;

      await Promise.all([loadTasksVision(), loadASLModel()]);

      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      const recognizer = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: {
          delegate: "GPU",
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      if (cancelled) {
        recognizer.close();
        return;
      }

      recRef.current = recognizer;

      // Canvas / drawing
      if (canvasEl) {
        const ctx = canvasEl.getContext("2d");
        ctxRef.current = ctx;
        drawerRef.current = ctx ? new DrawingUtils(ctx) : null;
      }

      const schedule = (next) => {
        if (videoEl.requestVideoFrameCallback) {
          frameRef.current = videoEl.requestVideoFrameCallback(() => next());
        } else {
          frameRef.current = requestAnimationFrame(next);
        }
      };

      const loop = () => {
        if (cancelled || !recRef.current || !videoEl) return;

        if (videoEl.readyState < 2) {
          schedule(loop);
          return;
        }

        const ctx = ctxRef.current;
        const drawer = drawerRef.current;

        // Resize canvas to match video pixels
        if (canvasEl && ctx) {
          const w = videoEl.videoWidth || 1280;
          const h = videoEl.videoHeight || 720;
          if (canvasEl.width !== w) canvasEl.width = w;
          if (canvasEl.height !== h) canvasEl.height = h;
        }

        // ---- Run MediaPipe recognizer ----
        const ts = performance.now();
        const result = recRef.current.recognizeForVideo(videoEl, ts);

        // ---- Draw landmarks ----
        if (
          drawer &&
          ctx &&
          result &&
          Array.isArray(result.landmarks) &&
          result.landmarks.length > 0
        ) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
          for (const lm of result.landmarks) {
            drawer.drawLandmarks(lm);
            if (GestureRecognizer.HAND_CONNECTIONS) {
              drawer.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS);
            }
          }
        } else if (ctx && canvasEl) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }

        // ---- GOOGLE GESTURE (built-in) ----
        let googleGesture = null;
        if (result && Array.isArray(result.gestures) && result.gestures.length) {
          const g0 = result.gestures[0];
          const top = Array.isArray(g0)
            ? g0[0]
            : g0?.categories?.[0] ?? null;

          if (top && typeof top.categoryName === "string") {
            googleGesture = {
              label: top.categoryName,
              score: typeof top.score === "number" ? top.score : 0,
              source: "google",
            };
          }
        }

        // ---- ASL FEATURES (2 hands → 126 dims) ----
        let aslGesture = null;
        if (result && ASLModel && ASLLabels) {
          const handsLm = result.landmarks || [];
          const handed = result.handednesses || [];

          let left63 = new Array(63).fill(0);
          let right63 = new Array(63).fill(0);

          for (let i = 0; i < handsLm.length; i++) {
            const lm = handsLm[i];
            const info = handed[i]?.[0];
            const which =
              info?.displayName || info?.categoryName || "Unknown";

            const flat = flattenLandmarks21(lm);
            if (which === "Right") {
              right63 = flat;
            } else if (which === "Left") {
              left63 = flat;
            } else {
              // If unknown, just put first hand into right, second into left
              if (i === 0) right63 = flat;
              else left63 = flat;
            }
          }

          const frameFeat = left63.concat(right63); // 126
          const seq = seqRef.current;
          seq.push(frameFeat);
          if (seq.length > 30) seq.shift();

          if (seq.length === 30) {
            // [1, 30, 126]
            tf.tidy(() => {
              const input = tf.tensor([seq]);
              const logits = ASLModel.predict(input);
              const probs = logits.dataSync(); // Float32Array
              let bestIdx = 0;
              let bestScore = probs[0];
              for (let i = 1; i < probs.length; i++) {
                if (probs[i] > bestScore) {
                  bestScore = probs[i];
                  bestIdx = i;
                }
              }
              const label = ASLLabels[bestIdx] || `class_${bestIdx}`;
              aslGesture = {
                label,
                score: bestScore,
                source: "asl",
              };
            });
          }
        }

        // ---- Combine according to priority: Google > ASL ----
        let finalGesture = null;

        if (googleGesture && googleGesture.score >= googleMinScore) {
          finalGesture = googleGesture;
        } else if (aslGesture && aslGesture.score >= aslMinScore) {
          finalGesture = aslGesture;
        }

        if (typeof onGesture === "function") {
          if (finalGesture) {
            const smoothed = pushAndSmooth(
              finalGesture.label,
              finalGesture.score
            );
            onGesture({
              ...finalGesture,
              label: smoothed.label,
              score: smoothed.score,
            });
          } else {
            onGesture(null);
          }
        }

        schedule(loop);
      };

      loop();
    }

    if (enabled) {
      init();
    }

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      if (recRef.current && typeof recRef.current.close === "function") {
        recRef.current.close();
      }
      recRef.current = null;
      ctxRef.current = null;
      drawerRef.current = null;
      historyRef.current = [];
      seqRef.current = [];
    };
  }, [enabled, videoEl, canvasEl, googleMinScore, aslMinScore, onGesture, smoothWindow]);
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
  const [gesture, setGesture] = useState(null); // {label, score, source}

  // Attach MediaStream
  useEffect(() => {
    if (!videoRef.current) return;
    const hasStream = props.stream instanceof MediaStream;
    if (hasStream) {
      videoRef.current.srcObject = props.stream;
      videoRef.current
        .play()
        .catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
  }, [props.stream]);

  useReadGestureFromVideo({
    videoEl: videoRef.current,
    canvasEl: canvasRef.current,
    enabled: !!props.gestureOn,
    googleMinScore: 0.75,
    aslMinScore: 0.8,
    smoothWindow: 5,
    onGesture: (g) => {
      setGesture(g);
      if (typeof props.onGesture === "function") {
        props.onGesture(g, { isLocal: !!props.isLocal });
      }
    },
  });

  const hasStream = props.stream instanceof MediaStream;
  const showBadge =
    typeof props.badgeText === "string" && props.badgeText.trim().length > 0;

  return (
    <div className="tile">
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
          {gesture.source === "asl" ? "ASL:" : "Gest:"} {gesture.label}{" "}
          {(gesture.score * 100).toFixed(0)}%
        </div>
      )}

      <div className="tile-media">
        {hasStream ? (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted={!!props.isLocal}
              className="tile-video"
            />
            <canvas
              ref={canvasRef}
              className="tile-overlay"
              style={{ opacity: props.gestureOn ? 1 : 0 }}
              width={1280}
              height={720}
            />
          </>
        ) : (
          <div className="placeholder">
            <IconUser />
          </div>
        )}
      </div>
    </div>
  );
}
