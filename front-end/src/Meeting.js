import React, { useEffect, useState } from "react";
import VideoTile from "./components/VideoTile";
import ControlsBar from "./components/ControlsBar";
import TranslationFeed from "./components/TranslationFeed";
import "./Meeting.css";
import { useNavigate } from 'react-router-dom'; 

function Meeting() {
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [gestureOn, setGestureOn] = useState(false); // global gesture toggle

  // local stream goes to top-left (index 0)
  const [localStream, setLocalStream] = useState(null);

  // placeholders for remaining tiles (replace with WebRTC later)
  const participants = [
    { id: "1", isLocal: true },
    { id: "2", isLocal: false, stream: null },
    { id: "3", isLocal: false, stream: null },
    { id: "4", isLocal: false, stream: null },
  ];

  const messages = [
    { id: 1, who: "Display_Name__1", t: "00:01:57", text: "Hello.", color: "pink" },
    { id: 2, who: "Display_Name__2", t: "00:03:27", text: "Hi! What’s your favorite color?", color: "indigo" },
    { id: 3, who: "Display_Name__1", t: "00:05:27", text: "My favorite color is probably pink", color: "pink" },
    { id: 4, who: "Display_Name__2", t: "00:06:21", text: "My favorite color is blue because it’s peaceful", color: "indigo" },
    { id: 5, who: "Display_Name__1", t: "00:06:27", text: "My favorite color is blue", color: "pink" },
    { id: 6, who: "Display_Name__1", t: "00:06:32", text: "Oh wow thanks for sharing.", color: "indigo" },
  ];

  // start local camera for the top-left tile
  useEffect(() => {
    let streamRef = null;
    async function start() {
      try {
        streamRef = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 360 },
          audio: false
        });
        setLocalStream(streamRef);
      } catch (e) {
        console.error("getUserMedia failed", e);
      }
    }
    start();
    return () => {
      if (streamRef) streamRef.getTracks().forEach(t => t.stop());
    };
  }, []);

  // camera toggle: enable/disable local video track without stopping it
  useEffect(() => {
    if (!localStream) return;
    const vTracks = localStream.getVideoTracks();
    for (let i = 0; i < vTracks.length; i++) {
      vTracks[i].enabled = camOn; // false => black video; true => resumes immediately
    }
  }, [camOn, localStream]);

  function handleToggleMic() {
    setMicOn(!micOn);
    // NOTE: when you add audio to localStream, set audioTrack.enabled = micOn here
  }

  function handleToggleCam() {
    setCamOn(!camOn);
  }

  function handleToggleGesture() {
    setGestureOn(g => !g);
  }

  function handleEndCall() {
    alert("Call ended!");
    navigate(`/home`);
  }

  return (
    <div id="page-content">
      <div className="meeting-shell">
        {/* Main row with two equal-height panels */}
        <div className="meeting-main">
          <section className="meeting-left">
            <div className="panel">
              <div className="meeting-title-1">Meeting Name</div>

              <div className="video-grid">
                {participants.map((p, idx) => (
                  <VideoTile
                    key={p.id}
                    // local stream goes to index 0
                    stream={idx === 0 ? localStream : p.stream || null}
                    isLocal={idx === 0}
                    gestureOn={gestureOn} // global gesture overlay toggle
                  />
                ))}
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

        {/* Bottom control bar (full width, equals the width of the two panels combined) */}
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
