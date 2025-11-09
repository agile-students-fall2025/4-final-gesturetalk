import React, { useEffect, useMemo, useRef, useState } from "react";

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

// Ring buffer that holds the last 10 labels/frames and computes mode (most frequent item)
// Used to stabilize flickery frame-by-frame results
class RingBuffer {
  constructor(max = 10) {
    this.buf = [];
    this.max = max;
  }
  push(x) {
    this.buf.push(x);
    if (this.buf.length > this.max) this.buf.shift();
  }
  mode(by = function (x) { return String(x); }) {
    const map = new Map();
    for (var i = 0; i < this.buf.length; i++) {
      const v = this.buf[i];
      const k = by(v);
      map.set(k, (map.get(k) || 0) + 1);
    }
    var best = null;
    for (const entry of map.entries()) {
      const k = entry[0];
      const c = entry[1];
      if (!best || c > best[1]) best = [k, c];
    }
    return best ? { label: best[0], count: best[1] } : null;
  }
}

// ---- Hook: run Gesture Recognizer on a <video> and draw to <canvas> ----
function useGestureRecognizer(opts) {
  const videoEl = opts.videoEl; // HTMLVideoElement to read from
  const canvasEl = opts.canvasEl; // HTMLCanvasElement to draw to (only to show the landmarks for testing
  // probably wshould disable this in production)
  const onResult = opts.onResult; // callback(result) for each recognition result
  const enabled = opts.enabled; // start/stop

  const recognizerRef = useRef(null);
  const frameHandle = useRef(null);

  useEffect(function () {
    var cancelled = false;
    var ctx = null;
    var drawer = null;

    async function init() {
      // only start when enabled and video element is present
      if (!enabled || !videoEl) return;

      // Load libs and create recognizer in VIDEO mode
      await loadTasksVision();
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        //"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const recognizer = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: {
          delegate: "GPU",
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
            //"https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
      if (cancelled) return;
      recognizerRef.current = recognizer;

      // if canvas exist prepare drawer
      if (canvasEl) {
        ctx = canvasEl.getContext("2d");
        drawer = ctx ? new DrawingUtils(ctx) : null;
      }

      function schedule(next) {
        if (videoEl && videoEl.requestVideoFrameCallback) {
          frameHandle.current = videoEl.requestVideoFrameCallback(next);
        } else {
          frameHandle.current = requestAnimationFrame(next);
        }
      }

      function loop() {
        if (cancelled || !recognizerRef.current || !videoEl) return;

        // Ensure the video has current frame data before calling recognizeForVideo.
        if (videoEl.readyState < 2) { // HAVE_CURRENT_DATA
          schedule(loop);
          return;
        }

        // Match canvas size to the video
        if (canvasEl && ctx) {
          const w = videoEl.videoWidth || 1280;
          const h = videoEl.videoHeight || 720;
          if (canvasEl.width !== w) canvasEl.width = w;
          if (canvasEl.height !== h) canvasEl.height = h;
        }

        // Run recognition
        const ts = performance.now();
        const result = recognizerRef.current.recognizeForVideo(videoEl, ts);

        // Draw landmarks (if any)
        if (drawer && ctx && result && Array.isArray(result.landmarks) && result.landmarks.length > 0) {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
          const all = result.landmarks;
          for (var i = 0; i < all.length; i++) {
            const lm = all[i];
            drawer.drawLandmarks(lm);
            if (GestureRecognizer && GestureRecognizer.HAND_CONNECTIONS) {
              drawer.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS);
            }
          }
        } else if (ctx && canvasEl) {
          // Clear if nothing to draw
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }

        // Emit result safely
        if (typeof onResult === "function") {
          onResult(result || null);
        }

        schedule(loop);
      }

      schedule(loop);
    }

    init();


    // cleanup on disable/unmount
    return function cleanup() {
      cancelled = true;
      if (frameHandle.current) cancelAnimationFrame(frameHandle.current);
      frameHandle.current = null;
      if (recognizerRef.current && typeof recognizerRef.current.close === "function") {
        recognizerRef.current.close();
      }
      recognizerRef.current = null;
      ctx = null;
      drawer = null;
    };
  }, [enabled, videoEl, canvasEl, onResult]);
}

// ---- Main component: local camera demo; swap to remote stream later ----
export default function DummyGestureCall() {
  const localVideoRef = useRef(null);
  const overlayRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("–");
  const [score, setScore] = useState(0);
  const [usingRemote, setUsingRemote] = useState(false);

  const buffer = useMemo(function () { return new RingBuffer(5); }, []);

  // Start/stop local camera as a stand‑in for WebRTC remote
  useEffect(function () {
    var stream = null;

    async function start() {
      if (!localVideoRef.current) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      } catch (e) {
        console.error("getUserMedia failed", e);
      }
    }

    if (running && !usingRemote) start();

    return function stop() {
      if (stream) {
        const tracks = stream.getTracks();
        for (var i = 0; i < tracks.length; i++) tracks[i].stop();
      }
      stream = null;
    };
  }, [running, usingRemote]);

  // Run recognizer on whichever video is currently attached
  useGestureRecognizer({
    videoEl: localVideoRef.current,
    canvasEl: overlayRef.current,
    enabled: running,
    onResult: function (r) {
      // r.gestures can be missing or empty; guard carefully
      var top = null;
      if (r && Array.isArray(r.gestures) && r.gestures.length > 0) {
        var g0 = r.gestures[0];
        if (g0 && Array.isArray(g0.categories) && g0.categories.length > 0) {
          top = g0.categories[0];
        }
      }

      if (!top) {
        // No gesture detected this frame
        setLabel("–");
        setScore(0);
        return;
      }

      buffer.push({ name: top.categoryName, score: top.score });
      const best = buffer.mode(function (x) { return x.name; });
      if (best) {
        setLabel(best.label);
        const items = buffer.buf.filter(function (x) { return x.name === best.label; });
        var total = 0;
        for (var i = 0; i < items.length; i++) total += items[i].score;
        const avg = total / Math.max(1, items.length);
        setScore(avg);
      }
    }
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">Dummy Video Call + Gesture Recognizer</h1>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <button
          className={"px-4 py-2 rounded-2xl shadow " + (running ? "bg-gray-200" : "bg-black text-white")}
          onClick={function () { setRunning(function (v) { return !v; }); }}
        >
          {running ? "Stop" : "Start"}
        </button>
        <button
          className={"px-4 py-2 rounded-2xl shadow " + (usingRemote ? "bg-violet-600 text-white" : "bg-gray-200")}
          onClick={function () {
            // Placeholder for WebRTC remote stream integration.
            // When you have a remote MediaStream, set it here:
            // localVideoRef.current.srcObject = remoteStream;
            setUsingRemote(function (u) { return !u; });
          }}
        >
          {usingRemote ? "Using Remote (dummy)" : "Use Remote (dummy)"}
        </button>
      </div>

      {/* Video + overlay */}
      <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow">
        <video
          ref={localVideoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full"
          width={1280}
          height={720}
        />
      </div>

      {/* HUD */}
      <div className="mt-2 text-center">
        <p className="text-sm opacity-70">Smoothed Gesture</p>
        <p className="text-xl font-medium">{label} {score ? "(" + (score * 100).toFixed(0) + "%)" : ""}</p>
      </div>

      {/* How to replace with real WebRTC later */}
      <details className="mt-4 w-full max-w-4xl bg-gray-50 rounded-xl p-4">
        <summary className="cursor-pointer font-medium">Integrate a real remote stream</summary>
        <ol className="list-decimal ml-6 mt-2 space-y-1 text-sm">
          <li>Create your <code>RTCPeerConnection</code> and listen for <code>ontrack</code>.</li>
          <li>Build a <code>MediaStream</code> from the remote <code>MediaStreamTrack</code>.</li>
          <li>Set <code>localVideoRef.current.srcObject = remoteStream</code>.</li>
          <li>Call <code>setUsingRemote(true)</code>. No other code needs to change.</li>
        </ol>
      </details>
    </div>
  );
}

