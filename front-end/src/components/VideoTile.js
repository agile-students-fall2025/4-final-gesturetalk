import React from "react";

function VideoTile(props) {
  function IconUser() {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="5" />
        <path d="M3 22a9 9 0 0 1 18 0" />
      </svg>
    );
  }

  return (
    <div className="tile">
      {props.src ? <img src={props.src} alt="participant" /> : <div className="placeholder"><IconUser /></div>}
    </div>
  );
}

export default VideoTile;
