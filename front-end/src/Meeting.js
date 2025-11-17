import React, { useEffect, useState, useContext, useRef } from "react";
import VideoTile from "./components/VideoTile";
import ControlsBar from "./components/ControlsBar";
import TranslationFeed from "./components/TranslationFeed";
import "./Meeting.css";
import { useNavigate, useParams } from "react-router-dom";
import UserContext from './contexts/UserContext';
import { io } from "socket.io-client";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

function Meeting() {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const { currentUser } = useContext(UserContext);

  // ---- Refs ----
  if (!currentUser) {
    alert("Please sign in.");
    navigate("/");
  }

  // ---- Socket & WebRTC state (use refs for persistence) ----
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);

  // ---- State ----
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [gestureOn, setGestureOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);

  // ---- Translation log (remove initial dummy messages if you want) ----
  const [messages, setMessages] = useState([]);

  const appendMessage = (who, text, color = "indigo") => {
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        who,
        t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        text,
        color,
      },
    ]);
  };

  // ---- Initialize socket & media ----
  useEffect(() => {
    socketRef.current = io("http://localhost:3001", { transports: ["websocket"] });
    const socket = socketRef.current;

    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 360 },
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        setParticipants([{ id: socket.id, isLocal: true, stream }]);

        const roomID = meetingId || "default-room";
        socket.emit("join-room", { meetingId: roomID, userId: currentUser?.id });
      } catch (err) {
        console.error("getUserMedia failed", err);
      }
    }

    startMedia();

    // ---- Socket event handlers ----
    socket.on("user-joined", async (data) => {
      console.log(`Peer joined:`, data);
      const peerId = data.socketId;
      await makeCall(peerId);
    });

    socket.on("offer", async (data) => {
      const { sdp, sender } = data;
      await handleOffer(sdp, sender);
    });

    socket.on("answer", async (data) => {
      const { sdp, sender } = data;
      await handleAnswer(sdp, sender);
    });

    socket.on("ice-candidate", async (data) => {
      const { candidate, sdpMid, sdpMLineIndex, sender } = data;
      await handleCandidate(sender, candidate, sdpMid, sdpMLineIndex);
    });

    socket.on("user-left", (data) => {
      console.log(`Peer left:`, data);
      const peerId = data.socketId;
      const pc = peerConnectionsRef.current[peerId];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[peerId];
      }
      setParticipants((prev) => prev.filter((p) => p.id !== peerId));
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (socket) socket.disconnect();
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    };
  }, [meetingId, currentUser]);

  // ---- WebRTC functions ----
  async function makeCall(peerId) {
    try {
      const pc = new RTCPeerConnection(configuration);
      peerConnectionsRef.current[peerId] = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketRef.current.emit("ice-candidate", {
            target: peerId,
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
          });
        }
      };

      pc.ontrack = (e) => {
        console.log("Remote track received from", peerId);
        setParticipants((prev) => {
          const exists = prev.find((p) => p.id === peerId);
          if (exists) {
            return prev.map((p) =>
              p.id === peerId ? { ...p, stream: e.streams[0] } : p
            );
          }
          return [...prev, { id: peerId, isLocal: false, stream: e.streams[0] }];
        });
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("offer", {
        target: peerId,
        sdp: offer.sdp,
      });
    } catch (err) {
      console.error("makeCall error", err);
    }
  }

  async function handleOffer(sdp, peerId) {
    try {
      const pc = new RTCPeerConnection(configuration);
      peerConnectionsRef.current[peerId] = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketRef.current.emit("ice-candidate", {
            target: peerId,
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
          });
        }
      };

      pc.ontrack = (e) => {
        console.log("Remote track received from", peerId);
        setParticipants((prev) => {
          const exists = prev.find((p) => p.id === peerId);
          if (exists) {
            return prev.map((p) =>
              p.id === peerId ? { ...p, stream: e.streams[0] } : p
            );
          }
          return [...prev, { id: peerId, isLocal: false, stream: e.streams[0] }];
        });
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit("answer", {
        target: peerId,
        sdp: answer.sdp,
      });
    } catch (err) {
      console.error("handleOffer error", err);
    }
  }

  async function handleAnswer(sdp, peerId) {
    try {
      const pc = peerConnectionsRef.current[peerId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
      }
    } catch (err) {
      console.error("handleAnswer error", err);
    }
  }

  async function handleCandidate(peerId, candidate, sdpMid, sdpMLineIndex) {
    try {
      const pc = peerConnectionsRef.current[peerId];
      if (pc && candidate) {
        await pc.addIceCandidate(
          new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex })
        );
      }
    } catch (err) {
      console.error("handleCandidate error", err);
    }
  }

  // ---- Camera/Mic toggles ----
  useEffect(() => {
    if (!localStream) return;
    const vTracks = localStream.getVideoTracks();
    vTracks.forEach((t) => (t.enabled = camOn));
  }, [camOn, localStream]);

  useEffect(() => {
    if (!localStream) return;
    const aTracks = localStream.getAudioTracks();
    aTracks.forEach((t) => (t.enabled = micOn));
  }, [micOn, localStream]);

  // ---- Control handlers ----
  const handleToggleMic = () => setMicOn((v) => !v);
  const handleToggleCam = () => setCamOn((v) => !v);
  const handleToggleGesture = () => setGestureOn((g) => !g);

  const handleEndCall = () => {
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    navigate("/home");
  };

  // Callback to receive translated sentence from VideoTile
  const handleTranslatedSentence = (sentence) => {
    appendMessage("You", sentence, "pink");
  };

  return (
    <div id="page-content">
      <div className="meeting-shell">
        <div className="meeting-main">
          <section className="meeting-left">
            <div className="panel">
              <div className="meeting-title-1">Meeting {meetingId}</div>
              <div className="video-grid">
                {participants.map((p) => (
                  <VideoTile
                    key={p.id}
                    stream={p.stream}
                    isLocal={p.isLocal}
                    gestureOn={gestureOn}
                    cameraOn={camOn}
                    badgeText={p.isLocal ? "You" : "Participant"}
                    onTranslatedSentence={handleTranslatedSentence} // Pass callback
                  />
                ))}
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

        <div className="controls-bar">
          <ControlsBar
            micOn={micOn}
            camOn={camOn}
            gestureOn={gestureOn}
            onToggleMic={handleToggleMic}
            onToggleCam={handleToggleCam}
            onToggleGesture={handleToggleGesture}
            onEndCall={handleEndCall}
          />
        </div>
      </div>
    </div>
  );
}

export default Meeting;