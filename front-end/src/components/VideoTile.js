// src/components/VideoTile.js
import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";

// =========================
//  MediaPipe loader (CDN)
// =========================
const MP_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js",
];

// inject scripts once, then reuse
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

// keep ONE Hands instance (one WebGL context) globally
function getGlobalHands(HandsCtor) {
  if (!window.__aslHandsInstance) {
    const hands = new HandsCtor({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    window.__aslHandsInstance = hands;
  }
  return window.__aslHandsInstance;
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
//  Hook: ASL from video
// =========================
const SEQ_LENGTH = 30;
const HAND_DIM = 126; // 63 left + 63 right

function useASLFromVideo({ videoEl, canvasEl, enabled, onGesture }) {
  const ctxRef = useRef(null);
  const seqRef = useRef([]); // [N, 126]
  const historyRef = useRef([]); // smoothing
  const cameraRef = useRef(null);

  function pushAndSmooth(label, score, windowSize = 5) {
    const buf = historyRef.current;
    buf.push({ label, score });
    if (buf.length > windowSize) buf.shift();

    const counts = new Map();
    for (const item of buf) {
      counts.set(item.label, (counts.get(item.label) || 0) + 1);
    }
    let bestLabel = null;
    let bestCount = -1;
    for (const [k, c] of counts.entries()) {
      if (c > bestCount) {
        bestCount = c;
        bestLabel = k;
      }
    }
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

      await Promise.all([loadMediapipeFromCDN(), loadASLModel()]);
      if (cancelled) return;

      const { Hands, Camera, drawConnectors, drawLandmarks } =
        await loadMediapipeFromCDN();

      // canvas context
      if (canvasEl) {
        ctxRef.current = canvasEl.getContext("2d");
      }

      // *** reuse ONE global Hands instance ***
      const hands = getGlobalHands(Hands);

      // feature extractor with flipped L/R to match training
      function extractHandFeatures(results) {
        let left = Array(63).fill(0);
        let right = Array(63).fill(0);

        const handsLms = results.multiHandLandmarks;
        const handedness = results.multiHandedness;

        if (handsLms && handedness) {
          handsLms.forEach((hand, idx) => {
            const side = handedness[idx].label; // "Left" / "Right"
            const flat = hand.flatMap((lm) => [lm.x, lm.y, lm.z]); // 21*3

            // flip slots to match your training
            if (side === "Left") {
              right = flat;
            } else if (side === "Right") {
              left = flat;
            }
          });
        }

        return left.concat(right).map((v) => (Number.isFinite(v) ? v : 0)); // 126
      }

      // onResults is replaced each time we call it, so sharing Hands is fine
      hands.onResults((results) => {
        if (cancelled) return;
        const ctx = ctxRef.current;
        if (!ctx || !canvasEl) return;

        const w = videoEl.videoWidth || 640;
        const h = videoEl.videoHeight || 480;
        if (canvasEl.width !== w) canvasEl.width = w;
        if (canvasEl.height !== h) canvasEl.height = h;

        // draw video frame
        ctx.save();
        ctx.clearRect(0, 0, w, h);
        if (results.image) {
          ctx.drawImage(results.image, 0, 0, w, h);
        }

        // draw landmarks
        if (results.multiHandLandmarks && results.multiHandLandmarks.length) {
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

        const hasHands =
          results.multiHandLandmarks &&
          results.multiHandLandmarks.length > 0;

        // if no hands → slowly forget sequence and skip prediction
        if (!hasHands) {
          const seq = seqRef.current;
          if (seq.length > 0) seq.shift();
          return;
        }

        // build feature sequence
        const features = extractHandFeatures(results); // 126
        const seq = seqRef.current;
        seq.push(features);
        if (seq.length > SEQ_LENGTH) seq.shift();

        if (!ASLModel || !ASLLabels || seq.length < SEQ_LENGTH) {
          return;
        }

        // ========= prediction =========
        const flat = seq.flat();
        const input = tf.tensor3d(flat, [1, SEQ_LENGTH, HAND_DIM]);

        let bestIdx = 0;
        let bestScore = 0;

        try {
          const logits = ASLModel.predict(input);
          const probs = logits.dataSync(); // Float32Array

          if (probs && probs.length > 0) {
            bestIdx = 0;
            bestScore = probs[0];
            for (let i = 1; i < probs.length; i++) {
              if (probs[i] > bestScore) {
                bestScore = probs[i];
                bestIdx = i;
              }
            }
          }

          logits.dispose();
        } catch (e) {
          console.error("ASL predict error:", e);
        } finally {
          input.dispose();
        }

        const label = ASLLabels[bestIdx] || `class_${bestIdx}`;
        const smoothed = pushAndSmooth(label, bestScore, 5);

        if (typeof onGesture === "function") {
          onGesture({
            label: smoothed.label,
            score: smoothed.score,
            source: "asl",
          });
        }

        // draw HUD text
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 350, 45);
        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.fillText(
          `Prediction: ${smoothed.label} ${(smoothed.score * 100).toFixed(0)}%`,
          10,
          32
        );
      });

      // Camera is per-tile, but uses shared Hands
      const camera = new Camera(videoEl, {
        onFrame: async () => {
          if (cancelled) return;
          await hands.send({ image: videoEl });
        },
        width: 640,
        height: 480,
      });

      cameraRef.current = camera;
      camera.start();
    }

    if (enabled) {
      init();
    }

    return () => {
      cancelled = true;
      historyRef.current = [];
      seqRef.current = [];
      if (cameraRef.current && cameraRef.current.stop) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.warn("Camera stop error:", e);
        }
      }
      cameraRef.current = null;
      ctxRef.current = null;
      // we **do not** close the global Hands instance here,
      // so WebGL context stays alive and we don't hit the
      // "Too many active WebGL contexts" limit.
    };
  }, [enabled, videoEl, canvasEl, onGesture]);
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
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
  }, [props.stream]);

  useASLFromVideo({
    videoEl: videoRef.current,
    canvasEl: canvasRef.current,
    enabled: !!props.gestureOn,
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
          ASL: {gesture.label} {(gesture.score * 100).toFixed(0)}%
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
              width={640}
              height={480}
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
