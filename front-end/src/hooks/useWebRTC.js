import { useRef, useEffect, useState } from "react";
import { rtcConfig } from "../utils/rtcConfig";

export const useWebRTC = ({
    socket,
    joinRoom,
    sendOffer,
    sendAnswer,
    sendICECandidate,
    onUserJoined,
    onOffer,
    onAnswer,
    onICECandidate,
    onUserDisconnected,
    }) => {
  const pc = useRef(null); // single peer connection per user!!!! not multi yet
  const localStream = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: MediaStream }

  useEffect(() => {
    // init the peer connection
    pc.current = new RTCPeerConnection(rtcConfig);

    // handle remote tracks
    pc.current.ontrack = (event) => {
      const stream = event.streams[0];
      const peerId = event.target.peerId || "unknown";
      setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
    };

    // handle ICE candidates generated locally
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.sendICECandidate(event.target.peerId, event.candidate);
      }
    };

    return () => {
      // cleanup
      pc.current?.close();
      localStream.current?.getTracks().forEach(track => track.stop());
    };
  }, [socket]);

  const startMedia = async () => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360 },
        audio: true,
      });

      // add tracks to PC
      localStream.current.getTracks().forEach(track => pc.current.addTrack(track, localStream.current));
      return localStream.current;
    } catch (err) {
      console.error("getUserMedia failed", err);
      return null;
    }
  };

  const connectToPeers = (roomID) => {
    joinRoom(roomID);

    // when another user joins, create an offer
    onUserJoined(async (peerId) => {
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      sendOffer(peerId, offer);
    });

    // handle incoming offer
    onOffer(async ({ sender, sdp }) => {
      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      sendAnswer(sender, answer);
    });

    // handle incoming answer
    onAnswer(async ({ sender, sdp }) => {
      await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // handle incoming ICE candidates
    onICECandidate(async ({ sender, sdp }) => {
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(sdp));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    });

    // handle peer disconnect
    onUserDisconnected((peerId) => {
      setRemoteStreams(prev => {
        const updated = { ...prev };
        delete updated[peerId];
        return updated;
      });
    });
  };

  return {
    pc: pc.current,
    localStream: localStream.current,
    remoteStreams,
    startMedia,
    connectToPeers,
  };
};
