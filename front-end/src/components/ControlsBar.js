import React from "react";
import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";

// simple control bar with mic, cam, gestures, end
function ControlsBar(props) {
  return (
    <div className="controls">
      <button
        className={"ctrl " + (props.micOn ? "on" : "off")}
        onClick={props.onToggleMic}
        title={props.micOn ? "Mute mic" : "Unmute mic"}
      >
        {props.micOn ? <>Mic On<FiMic/></>: <>Mic Off<FiMicOff/></>} 
      </button>

      <button
        className={"ctrl " + (props.camOn ? "on" : "off")}
        onClick={props.onToggleCam}
        title={props.camOn ? "Turn camera off" : "Turn camera on"}
      >
        
        {props.camOn ? "Cam On" : "Cam Off"} {props.camOn ? <FiVideo /> : <FiVideoOff/>}
      </button>

      <button
        className={"ctrl " + (props.gestureOn ? "on" : "off")}
        onClick={props.onToggleGesture}
        title={props.gestureOn ? "Hide hand landmarks" : "Show hand landmarks"}
      >
        {props.gestureOn ? "Gestures: On" : "Gestures: Off"}
      </button>

      <button className="ctrl danger" onClick={props.onEndCall}>
        End Call
      </button>
    </div>
  );
}

export default ControlsBar;
