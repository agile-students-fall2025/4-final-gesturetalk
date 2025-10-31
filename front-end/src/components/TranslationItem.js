import React from "react";

function TranslationItem(props) {
  var colorClass = props.color === "pink" ? "pink" : "indigo";

  return (
    <div className="msg">
      <div className={"bubble " + colorClass}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="8" r="5" />
          <path d="M3 22a9 9 0 0 1 18 0" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div className="meta">
          <span style={{ fontWeight: 600 }}>{props.who}</span>
          <span>{props.time}</span>
        </div>
        <div className="text">{props.text}</div>
      </div>
    </div>
  );
}

export default TranslationItem;