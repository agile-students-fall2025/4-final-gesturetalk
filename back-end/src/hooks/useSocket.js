import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnect from socket");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
}
