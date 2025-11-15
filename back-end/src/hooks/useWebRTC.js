import { useEffect, useRef, useState } from "react";
import useSocket from "./useSocket";

export default function useWebRTC(roomId) {
  const socket = useSocket();

  const localVideoRef = useRef();
  const localStreamRef = useRef(null);

  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const [remoteStreams, setRemoteStreams] = useState([]);

 
  async function initLocalStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error("Could not get user media:", err);
    }
  }

  // create peer connect
  function createPeerConnection(targetSocketId) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ],
    });

    // when local ice, send to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: targetSocketId,
          sdp: event.candidate,
        });
      }
    };

    // recieve stream
    pc.ontrack = (event) => {
      setRemoteStreams((prev) => [
        ...prev.filter((s) => s.id !== event.streams[0].id),
        event.streams[0],
      ]);
    };

    // adding local tracks
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    peersRef.current[targetSocketId] = pc;
    return pc;
  }

  // socket event setup
  useEffect(() => {
    if (!socket) return;
    if (!roomId) return;

    initLocalStream().then(() => {
      socket.emit("join-room", roomId);
    });

    // new user join
    socket.on("user-joined", async (socketId) => {
      const pc = createPeerConnection(socketId);
      const offer = await pc.createOffer();

      await pc.setLocalDescription(offer);

      socket.emit("offer", {
        target: socketId,
        sdp: pc.localDescription,
      });
    });

    // when offer, answer
    socket.on("offer", async ({ sender, sdp }) => {
      const pc = createPeerConnection(sender);

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", {
        target: sender,
        sdp: pc.localDescription,
      });
    });

    // when answer
    socket.on("answer", async ({ sender, sdp }) => {
      const pc = peersRef.current[sender];
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // get ice from peer
    socket.on("ice-candidate", async ({ sender, sdp }) => {
      const pc = peersRef.current[sender];
      if (!pc) return;

      await pc.addIceCandidate(new RTCIceCandidate(sdp));
    });

    // peer disconnect
    socket.on("user-disconnected", (socketId) => {
      const pc = peersRef.current[socketId];
      if (pc) pc.close();
      delete peersRef.current[socketId];

      setRemoteStreams((prev) =>
        prev.filter((s) => s._socketId !== socketId)
      );
    });

    return () => {
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-disconnected");

      Object.values(peersRef.current).forEach((pc) => pc.close());
    };
  }, [socket, roomId]);

  // emitting translated captions
  function sendCaptions(text) {
    if (socket) socket.emit("captions", text);
  }

  return {
    localVideoRef,
    remoteStreams,
    sendCaptions,
  };
}
