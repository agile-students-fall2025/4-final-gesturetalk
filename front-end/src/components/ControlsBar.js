import React from "react";

function ControlsBar(props) {
  function IconMic() {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M12 16v4"/><path d="M8 12a4 4 0 0 0 8 0"/>
      </svg>
    );
  }

  function IconCam() {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-4 3v2l4 3z"/>
      </svg>
    );
  }

  function IconPhone() {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 15c3-3 15-3 18 0"/><path d="M7 15v4M17 15v4"/>
      </svg>
    );
  }

  return (
    <>
      <div className="controls-actions">
        <button className="end-btn" onClick={props.onToggleMic}><IconMic /> MIC</button>
        <button className="end-btn" onClick={props.onToggleCam}><IconCam /> CAM</button>
      </div>
      <button className="end-btn" onClick={props.onEndCall}><IconPhone /> END</button>
    </>
  );
}

export default ControlsBar;

