import React, { useEffect, useRef, useState } from "react";

/* ========== MediaPipe dynamic imports (avoid SSR issues) ========== */
let FilesetResolver;
let GestureRecognizer;
let DrawingUtils;

async function loadTasksVision() {
  const mod = await import("@mediapipe/tasks-vision");
  FilesetResolver = mod.FilesetResolver;
  GestureRecognizer = mod.GestureRecognizer;
  DrawingUtils = mod.DrawingUtils;
  return mod;
}

/* ========== Hook inside this file: read gestures from a <video>, draw to <canvas> ========== 
   - Draws hand landmarks when enabled
   - Emits smoothed top gesture via onGesture(label/score/handedness/landmarks)
   - Tunables: minScore (confidence gate), smoothWindow (temporal smoothing)
*/
function useReadGestureFromVideo({ videoEl, canvasEl, enabled, onGesture, minScore = 0.65, smoothWindow = 5 }) {
  const recRef = useRef(null);
  const frameRef = useRef(null);
  const bufRef = useRef([]); // small ring buffer of recent labels/scores

  function pushAndMode(name, score) {
    const buf = bufRef.current;
    buf.push({ name, score });
    if (buf.length > smoothWindow) buf.shift();
    const counts = new Map();
    for (let i = 0; i < buf.length; i++) {
      const it = buf[i];
      counts.set(it.name, (counts.get(it.name) || 0) + 1);
    }
    let bestName = null, bestCount = -1;
    counts.forEach((c, k) => { if (c > bestCount) { bestCount = c; bestName = k; }});
    const items = buf.filter(x => x.name === bestName);
    let total = 0;
    for (let i = 0; i < items.length; i++) total += items[i].score;
    const avg = total / Math.max(1, items.length);
    return { label: bestName, score: avg, count: bestCount };
  }

  useEffect(function () {
    let cancelled = false;
    let ctx = null;
    let drawer = null;

    async function init() {
      if (!enabled || !videoEl) return;

      // Load and create recognizer
      await loadTasksVision();
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
      if (cancelled) return;
      recRef.current = recognizer;

      if (canvasEl) {
        ctx = canvasEl.getContext("2d");
        drawer = ctx ? new DrawingUtils(ctx) : null;
      }

      function schedule(next) {
        // Prefer requestVideoFrameCallback when available
        if (videoEl && videoEl.requestVideoFrameCallback) {
          frameRef.current = videoEl.requestVideoFrameCallback(() => next());
        } else {
          frameRef.current = requestAnimationFrame(next);
        }
      }

      function loop() {
        if (cancelled || !recRef.current || !videoEl) return;

        // Wait for usable frame data
        if (videoEl.readyState < 2) { // HAVE_CURRENT_DATA
          schedule(loop);
          return;
        }

        // Match canvas size to video pixels (keeps overlay aligned)
        if (canvasEl && ctx) {
          const w = videoEl.videoWidth || 1280;
          const h = videoEl.videoHeight || 720;
          if (canvasEl.width !== w) canvasEl.width = w;
          if (canvasEl.height !== h) canvasEl.height = h;
        }

        // Run recognition
        const ts = performance.now();
        const result = recRef.current.recognizeForVideo(videoEl, ts);

        // Draw landmarks if present
        if (drawer && ctx && result && Array.isArray(result.landmarks) && result.landmarks.length > 0) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
          const all = result.landmarks;
          for (let i = 0; i < all.length; i++) {
            const lm = all[i];
            drawer.drawLandmarks(lm);
            if (GestureRecognizer && GestureRecognizer.HAND_CONNECTIONS) {
              drawer.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS);
            }
          }
        } else if (ctx && canvasEl) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }

        // Extract top gesture, smooth, emit
        if (typeof onGesture === "function") {
          let top = null;
          if (result && Array.isArray(result.gestures) && result.gestures.length > 0) {
            const g0 = result.gestures[0];
            // Some builds use gestures[0][0], others expose categories[]
            top = Array.isArray(g0) ? g0[0] : (g0 && g0.categories && g0.categories[0]);
          }
          if (top && typeof top.categoryName === "string") {
            const name = top.categoryName;
            const score = typeof top.score === "number" ? top.score : (top && top.score) || 0;
            if (score >= minScore) {
              const smoothed = pushAndMode(name, score);
              onGesture({
                label: smoothed.label,
                score: smoothed.score,
                raw: top,
                handedness: result && result.handednesses && result.handednesses[0] && result.handednesses[0][0]
                  ? result.handednesses[0][0].displayName
                  : null,
                landmarks: result ? result.landmarks : null,
              });
            } else {
              onGesture(null);
            }
          } else {
            onGesture(null);
          }
        }

        schedule(loop);
      }

      schedule(loop);
    }

    init();

    // Cleanup
    return function cleanup() {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      if (recRef.current && typeof recRef.current.close === "function") recRef.current.close();
      recRef.current = null;
      ctx = null;
      drawer = null;
      bufRef.current = [];
    };
  }, [enabled, videoEl, canvasEl, onGesture, minScore, smoothWindow]);
}

/* ========== Simple placeholder icon (when no stream) ========== */
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="5" />
      <path d="M3 22a9 9 0 0 1 18 0" />
    </svg>
  );
}

/* ========== Main tile ========== 
   Props:
   - stream: MediaStream (local or remote)
   - isLocal: boolean (mutes local tile)
   - gestureOn: boolean (enable/disable recognition + overlay)
   - badgeText: string (flexible overlay text), badgeClass: string (optional)
   - onGesture: function(g, meta) (receives {label, score, ...}, {isLocal})
*/
export default function VideoTile(props) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState(null); // live label/score for HUD

  // Attach provided stream to <video>
  useEffect(function () {
    if (!videoRef.current) return;
    const hasStream = props.stream && typeof props.stream === "object";
    if (hasStream) {
      videoRef.current.srcObject = props.stream;
      videoRef.current.play().catch(function (){});
    } else {
      videoRef.current.srcObject = null;
    }
  }, [props.stream]);

  // Run recognition + draw overlay + emit results
  useReadGestureFromVideo({
    videoEl: videoRef.current,
    canvasEl: canvasRef.current,
    enabled: !!props.gestureOn,
    minScore: 0.65,
    smoothWindow: 5,
    onGesture: function (g) {
      setGesture(g);
      if (typeof props.onGesture === "function") {
        props.onGesture(g, { isLocal: !!props.isLocal });
      }
    }
  });

  const hasStream = props.stream && typeof props.stream === "object";
  const showBadge = typeof props.badgeText === "string" && props.badgeText.trim().length > 0;

  return (
    <div className="tile">
      {/* text overlay badge from prop; position via CSS .tile-badge */}
      {showBadge && (
        <div className={"tile-badge " + (props.badgeClass || "")}>
          {props.badgeText}
        </div>
      )}

      {/* optional tiny HUD on bottom-right */}
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
            fontWeight: 600
          }}
        >
          {gesture.label} {(gesture.score * 100).toFixed(0)}%
        </div>
      )}

      {/* video + overlay */}
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
          <div className="placeholder"><IconUser /></div>
        )}
      </div>
    </div>
  );
}