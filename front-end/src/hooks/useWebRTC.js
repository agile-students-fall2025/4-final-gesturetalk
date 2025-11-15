// handles webRTC peer connection
// uses functions exposed by useSocket.js
import { useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";
import { rtcConfig } from "../utils/rtcConfig";

export const useWebRTC = (roomID) => {
  const {
    joinRoom,
    sendOffer,
    sendAnswer,
    sendICECandidate,
    onUserJoined,
    onOffer,
    onAnswer,
    onICECandidate,
    onUserDisconnected
  } = useSocket();

  const pcRef = useRef(null);             // RTCPeerConnection
  const localStreamRef = useRef(null);    // MediaStream from getUserMedia
  const [remoteStream, setRemoteStream] = useState(null);
  const [inCall, setInCall] = useState(false);

  // initialize RTCPeerConnection + local media (videa & audio)
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      // get local media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (!isMounted) return;

      localStreamRef.current = localStream;

      // create peer connection
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      // add local tracks to connection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // when we get remote tracks -> update state
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStream(stream);
        setInCall(true);
      };

      // when we discover ICE candidates -> send them via signaling
      pc.onicecandidate = (event) => {
        if (event.candidate && remoteSocketIdRef.current) {
          sendICECandidate(remoteSocketIdRef.current, event.candidate);
        }
      };
    };

    setup();

    return () => {
      isMounted = false;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      setRemoteStream(null);
      setInCall(false);
    };
  }, []); // run once

  // keep track of who we’re talking to
  const remoteSocketIdRef = useRef(null);

  // join room via signaling
  useEffect(() => {
    if (!roomID) return;
    joinRoom(roomID);
  }, [roomID, joinRoom]);

  // signaling (what happens when someone joins our room)
  useEffect(() => {
    // when another user joins -> existing user becomes the caller
    const handleUserJoined = async (newUserId) => {
      remoteSocketIdRef.current = newUserId;

      const pc = pcRef.current;
      if (!pc) return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // send SDP offer via socket
      sendOffer(newUserId, offer);
    };

    onUserJoined(handleUserJoined);
  }, [onUserJoined, sendOffer]);

  // signaling (when we receive an offer) -> send answer
  useEffect(() => {
    const handleOffer = async ({ sdp, sender }) => {
      remoteSocketIdRef.current = sender;

      const pc = pcRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendAnswer(sender, answer);
    };

    onOffer(handleOffer);
  }, [onOffer, sendAnswer]);

  // signaling (when we receive an answer)
  useEffect(() => {
    const handleAnswer = async ({ sdp }) => {
      const pc = pcRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    onAnswer(handleAnswer);
  }, [onAnswer]);

  // signaling (when we receive an ICE candidate)
  useEffect(() => {
    const handleICE = async ({ sdp }) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(sdp));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    };

    onICECandidate(handleICE);
  }, [onICECandidate]);

  // handle remote user disconnect
  useEffect(() => {
    const handleUserDisconnected = (socketId) => {
      if (remoteSocketIdRef.current === socketId) {
        remoteSocketIdRef.current = null;
        setRemoteStream(null);
        setInCall(false);
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
      }
    };

    onUserDisconnected(handleUserDisconnected);
  }, [onUserDisconnected]);

  return {
    localStream: localStreamRef.current,
    remoteStream,
    inCall,
  };
};
