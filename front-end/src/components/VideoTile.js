import React, { useEffect, useRef } from "react";

let FilesetResolver;
let GestureRecognizer;
let DrawingUtils;

// dynamic import of mediapipe tasks-vision
async function loadTasksVision() {
  const mod = await import("@mediapipe/tasks-vision");
  FilesetResolver = mod.FilesetResolver;
  GestureRecognizer = mod.GestureRecognizer;
  DrawingUtils = mod.DrawingUtils;
  return mod;
}

// attach gesture recognizer to a <video>, draw to <canvas>
function useGestureOnTile({ videoEl, canvasEl, enabled }) {
  const recRef = React.useRef(null);
  const frameRef = React.useRef(null);

  useEffect(() => {
    let cancelled = false;
    let ctx = null;
    let drawer = null;

    async function init() {
      if (!enabled || !videoEl) return;

      // create recognizer (GPU + float16 model, pinned runtime)
      await loadTasksVision();
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const rec = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: {
          delegate: "GPU",
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
      if (cancelled) return;
      recRef.current = rec;

      if (canvasEl) {
        ctx = canvasEl.getContext("2d");
        drawer = ctx ? new DrawingUtils(ctx) : null;
      }

      function schedule(next) {
        if (videoEl && videoEl.requestVideoFrameCallback) {
          frameRef.current = videoEl.requestVideoFrameCallback(next);
        } else {
          frameRef.current = requestAnimationFrame(next);
        }
      }

      function loop() {
        if (cancelled || !recRef.current || !videoEl) return;

        if (videoEl.readyState < 2) {
          schedule(loop);
          return;
        }

        // size overlay to match video pixels (simple; keep video/canvas same box)
        if (canvasEl && ctx) {
          const w = videoEl.videoWidth || 1280;
          const h = videoEl.videoHeight || 720;
          if (canvasEl.width !== w) canvasEl.width = w;
          if (canvasEl.height !== h) canvasEl.height = h;
        }

        const ts = performance.now();
        const result = recRef.current.recognizeForVideo(videoEl, ts);

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

        schedule(loop);
      }

      schedule(loop);
    }

    init();

    // cleanup
    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      if (recRef.current && typeof recRef.current.close === "function") {
        recRef.current.close();
      }
      recRef.current = null;
      ctx = null;
      drawer = null;
    };
  }, [enabled, videoEl, canvasEl]);
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="5" />
      <path d="M3 22a9 9 0 0 1 18 0" />
    </svg>
  );
}

function VideoTile(props) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // attach provided stream (local or remote) to <video>
  useEffect(() => {
    if (!videoRef.current) return;
    const hasStream = props.stream && typeof props.stream === "object";
    if (hasStream) {
      videoRef.current.srcObject = props.stream;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
  }, [props.stream]);

  // integrate gesture recognizer (global toggle from ControlsBar)
  useGestureOnTile({
    videoEl: videoRef.current,
    canvasEl: canvasRef.current,
    enabled: !!props.gestureOn
  });

  const hasStream = props.stream && typeof props.stream === "object";
  const showBadge = typeof props.badgeText === "string" && props.badgeText.trim().length > 0;

  return (
    <div className="tile">
      {/* text overlay badge from prop; sits above video/canvas */}
      {showBadge && (
        <div
          className={"tile-badge " + (props.badgeClass || "")}
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 3
          }}
        >
          {props.badgeText}
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

export default VideoTile;