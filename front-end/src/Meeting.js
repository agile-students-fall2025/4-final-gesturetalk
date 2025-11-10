import React, { useEffect, useState } from "react";
import VideoTile from "./components/VideoTile";
import ControlsBar from "./components/ControlsBar";
import TranslationFeed from "./components/TranslationFeed";
import "./Meeting.css";
import { useNavigate } from "react-router-dom";

function Meeting() {
  const navigate = useNavigate();

  // ---- Controls state ----
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [gestureOn, setGestureOn] = useState(false); // global toggle for all tiles
  const [currentUser, setCurrentUser] = useState(null);

  // ---- Local media stream (goes to top-left tile) ----
  const [localStream, setLocalStream] = useState(null);

  // ---- Participants (placeholders for remote) ----
  const participants = [
    { id: "1", isLocal: true },
    { id: "2", isLocal: false, stream: null },
    { id: "3", isLocal: false, stream: null },
    { id: "4", isLocal: false, stream: null },
  ];

  // ---- Translation log (with gesture messages appended) ----
  const initialMessages = [
    { id: 1, who: "Display_Name__1", t: "00:01:57", text: "Hello.", color: "pink" },
    { id: 2, who: "Display_Name__2", t: "00:03:27", text: "Hi! What’s your favorite color?", color: "indigo" },
    { id: 3, who: "Display_Name__1", t: "00:05:27", text: "My favorite color is probably pink", color: "pink" },
    { id: 4, who: "Display_Name__2", t: "00:06:21", text: "My favorite color is blue because it’s peaceful", color: "indigo" },
    { id: 5, who: "Display_Name__1", t: "00:06:27", text: "My favorite color is blue", color: "pink" },
    { id: 6, who: "Display_Name__1", t: "00:06:32", text: "Oh wow thanks for sharing.", color: "indigo" },
  ];
  const [messages, setMessages] = useState(initialMessages);
  const appendMessage = (who, text, color = "indigo") => {
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        who,
        t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        text,
        color,
      },
    ]);
  };

  // ---- Start local camera at mount ----
  useEffect(() => {
    let streamRef = null;

    async function start() {
      try {
        streamRef = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 360 },
          audio: false, // add audio later; see mic toggle below
        });
        setLocalStream(streamRef);
      } catch (e) {
        console.error("getUserMedia failed", e);
      }
    }

    start();

    return () => {
      if (streamRef) streamRef.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ---- Camera toggle: enable/disable video track (don’t stop track) ----
  useEffect(() => {
    if (!localStream) return;
    const vTracks = localStream.getVideoTracks();
    for (let i = 0; i < vTracks.length; i++) vTracks[i].enabled = camOn;
  }, [camOn, localStream]);

  // ---- Mic toggle: when audio is added, wire it here ----
  useEffect(() => {
    if (!localStream) return;
    const aTracks = localStream.getAudioTracks?.() || [];
    for (let i = 0; i < aTracks.length; i++) aTracks[i].enabled = micOn;
  }, [micOn, localStream]);

  // ---- Controls handlers ----
  const handleToggleMic = () => setMicOn((v) => !v);
  const handleToggleCam = () => setCamOn((v) => !v);
  const handleToggleGesture = () => setGestureOn((g) => !g);

  const handleEndCall = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/meeting/end-meeting/${meetingId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ peerId: currentUser.id }),
        }
      );

      const data = await response.json();
      console.log(data.message);

      navigate("/home");
    } catch (err) {
      console.error("Error ending meeting:", err);
    }

  };

  // ---- Gesture event handler (from VideoTile) ----
  // g = { label, score, handedness, landmarks, raw } | null
  const handleTileGesture = (g, meta) => {
    if (!g) return; // nothing this frame
    const who = meta?.isLocal ? "You" : "Participant";
    appendMessage(
      who,
      `Gesture: ${g.label} (${Math.round(g.score * 100)}%)`,
      meta?.isLocal ? "pink" : "indigo"
    );
    // If you have a WebRTC datachannel, you can send g to the remote here.
  };

  return (
    <div id="page-content">
      <div className="meeting-shell">
        {/* Top row: left (video grid) + right (translation log) */}
        <div className="meeting-main">
          <section className="meeting-left">
            <div className="panel">
              <div className="meeting-title-1">Meeting Name</div>

              <div className="video-grid">
                {participants.map((p, idx) => {
                  const isLocal = idx === 0;
                  const stream = isLocal ? localStream : p.stream || null;
                  return (
                    <VideoTile
                      key={p.id}
                      stream={stream}
                      isLocal={isLocal}
                      gestureOn={gestureOn}
                      badgeText={isLocal ? "You" : `User ${idx + 1}`}
                      // optional: pass a class to restyle badge color per tile
                      badgeClass={isLocal ? "" : ""}
                      onGesture={handleTileGesture}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="meeting-right">
            <div className="panel log">
              <h2>Translation Log</h2>
              <TranslationFeed messages={messages} />
            </div>
          </aside>
        </div>

        {/* Bottom control bar (full width) */}
        <div className="controls-bar">
          <ControlsBar
            micOn={micOn}
            camOn={camOn}
            gestureOn={gestureOn}
            onToggleMic={handleToggleMic}
            onToggleCam={handleToggleCam}
            onToggleGesture={handleToggleGesture}
            onEndCall={handleEndCall}
          />
        </div>
      </div>
    </div>
  );
}

export default Meeting;