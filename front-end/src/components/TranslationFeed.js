import React, { useEffect, useRef } from "react";
import TranslationItem from "./TranslationItem";

function TranslationFeed(props) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [props.messages]);

  return (
    <div className="log-scroll" ref={scrollRef}>
      {props.messages.map((m) => (
        <TranslationItem
          key={m.id}
          who={m.who}
          time={m.t}
          text={m.text}
          color={m.color}
        />
      ))}
    </div>
  );
}

export default TranslationFeed;
