import React, { useState } from "react";
import VideoTile from "./components/VideoTile";
import ControlsBar from "./components/ControlsBar";
import TranslationFeed from "./components/TranslationFeed";
import "./Meeting.css";

function Meeting() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const participants = [
    { id: "1", src: null },
    { id: "2", src: null },
    { id: "3", src: null },
    { id: "4", src: null },
  ];

  const messages = [
    { id: 1, who: "Display_Name__1", t: "00:01:57", text: "Hello.", color: "pink" },
    { id: 2, who: "Display_Name__2", t: "00:03:27", text: "Hi! What’s your favorite color?", color: "indigo" },
    { id: 3, who: "Display_Name__1", t: "00:05:27", text: "My favorite color is probably pink", color: "pink" },
    { id: 4, who: "Display_Name__2", t: "00:06:21", text: "My favorite color is blue because it’s peaceful", color: "indigo" },
    { id: 5, who: "Display_Name__1", t: "00:06:27", text: "My favorite color is blue", color: "pink" },
    { id: 6, who: "Display_Name__1", t: "00:06:32", text: "Oh wow thanks for sharing.", color: "indigo" },
  ];

  function handleToggleMic() {
    setMicOn(!micOn);
  }

  function handleToggleCam() {
    setCamOn(!camOn);
  }

  function handleEndCall() {
    alert("Call ended!");
  }

  return (
  <div id="page-content">
    <div className="meeting-shell">
      {/* Main row with two equal-height panels */}
      <div className="meeting-main">
        <section className="meeting-left">
          <div className="panel">
            <div className="meeting-title">Meeting Name</div>

            <div className="video-grid">
              {participants.map((p) => <VideoTile key={p.id} src={p.src} />)}
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
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCam}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  </div>
);
}


export default Meeting;