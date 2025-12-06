import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
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
  iceCandidatePoolSize: 5,
};

function Meeting() {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const { currentUser } = useContext(UserContext);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);// user not signed in, redirect to sign in

  // ---- Socket & WebRTC state (use refs for persistence) ----
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const createdStreamsRef = useRef(new Set());

  const stopStreamTracks = useCallback((stream) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      if (track.readyState !== "ended") {
        track.stop();
      }
    });
  }, []);

  const disableCamera = useCallback(() => {
    const baseStream = localStreamRef.current;
    if (!baseStream) return;

    const videoTracks = baseStream.getVideoTracks();
    if (!videoTracks.length) return;

    const trackIds = new Set(videoTracks.map((track) => track.id));

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        const senderTrack = sender.track;
        if (senderTrack && trackIds.has(senderTrack.id)) {
          sender
            .replaceTrack(null)
            .catch((err) => console.warn("replaceTrack(null) failed", err));
        }
      });
    });

    videoTracks.forEach((track) => {
      baseStream.removeTrack(track);
      if (track.readyState !== "ended") {
        track.stop();
      }
    });

    const toRemove = [];
    createdStreamsRef.current.forEach((stream) => {
      if (stream === baseStream) return;
      const sharesTrack = stream
        .getTracks()
        .some((track) => trackIds.has(track.id));
      if (sharesTrack) {
        toRemove.push(stream);
      }
    });
    toRemove.forEach((stream) => {
      stopStreamTracks(stream);
      createdStreamsRef.current.delete(stream);
    });
  }, [stopStreamTracks]);

  const enableCamera = useCallback(async () => {
    const baseStream = localStreamRef.current;
    if (!baseStream) return;

    const liveTrack = baseStream
      .getVideoTracks()
      .find((track) => track.readyState === "live");

    if (liveTrack) {
      if (!liveTrack.enabled) {
        liveTrack.enabled = true;
      }
      return;
    }

    let videoStream;
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 360 },
        audio: false,
      });
    } catch (err) {
      console.error("Failed to acquire video stream", err);
      setCamOn(false);
      return;
    }

    createdStreamsRef.current.add(videoStream);

    const [videoTrack] = videoStream.getVideoTracks();
    if (!videoTrack) {
      stopStreamTracks(videoStream);
      createdStreamsRef.current.delete(videoStream);
      setCamOn(false);
      return;
    }

    baseStream.addTrack(videoTrack);

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const sender = pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(videoTrack).catch((err) => {
          console.warn("replaceTrack failed", err);
        });
      } else {
        pc.addTrack(videoTrack, baseStream);
      }
    });

    videoTrack.addEventListener("ended", () => {
      createdStreamsRef.current.delete(videoStream);
      setCamOn(false);
    });
  }, [stopStreamTracks]);

  // ---- State ----
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [gestureOn, setGestureOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);

  // ---- Translation log (remove initial dummy messages if you want) ----
  const [messages, setMessages] = useState([]);
  // Translation messages state; append helper removed because it was unused.

   // ---- Update local participant picture when currentUser changes ----
  useEffect(() => {
    const userPicture = currentUser?.picture || "/profile.svg";
    setParticipants((prev) =>
      prev.map((p) =>
        p.isLocal ? { ...p, picture: userPicture } : p
      )
    );
  }, [currentUser]);

  // ---- Initialize socket & media ----
  useEffect(() => {
    let cancelled = false;

    socketRef.current = io(process.env.REACT_APP_API_URL, { transports: ["websocket"] });
    const socket = socketRef.current;
    const streamsSet = createdStreamsRef.current;

    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 360 },
          audio: true,
        });

        streamsSet.add(stream);

        if (cancelled) {
          stopStreamTracks(stream);
          streamsSet.delete(stream);
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        const userPicture = currentUser?.picture || "/profile.svg";
        setParticipants([{ id: socket.id, isLocal: true, stream, picture: userPicture }]);

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
      const peerId = typeof data === 'string' ? data : data.socketId;
      if (!peerId) return;
      await makeCall(peerId);
    });

    socket.on("new-translation", (data) => {
    const { userName, sentence, timestamp } = data;
    console.log("New translation received:", data);
    
    // Add to translation feed
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        who: userName,
        t: new Date(timestamp).toLocaleTimeString([], { 
          hour: "2-digit", 
          minute: "2-digit", 
          second: "2-digit" 
        }),
        text: sentence,
        color: userName === currentUser?.name ? "pink" : "indigo",
      },
    ]);
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
      const peerId = typeof data === 'string' ? data : data.socketId;
      if (!peerId) return;
      const pc = peerConnectionsRef.current[peerId];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[peerId];
      }
      setParticipants((prev) => prev.filter((p) => p.id !== peerId));
    });

    return () => {
      cancelled = true;

      if (socket) {
        socket.disconnect();
      }

      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};

      if (localStreamRef.current) {
        stopStreamTracks(localStreamRef.current);
        localStreamRef.current = null;
      }

      streamsSet.forEach((stream) => stopStreamTracks(stream));
      streamsSet.clear();
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
    Object.entries(peerConnectionsRef.current).forEach(([peerId, pc]) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.readyState !== "ended") {
          sender.track.stop();
        }
      });
      pc.getReceivers().forEach((receiver) => {
        if (receiver.track && receiver.track.readyState !== "ended") {
          receiver.track.stop();
        }
      });
      pc.getTransceivers().forEach((transceiver) => {
        if (typeof transceiver.stop === "function") {
          transceiver.stop();
        }
      });
      pc.close();
      delete peerConnectionsRef.current[peerId];
    });
    peerConnectionsRef.current = {};

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    createdStreamsRef.current.forEach((stream) => stopStreamTracks(stream));
    createdStreamsRef.current.clear();
    localStreamRef.current = null;

    setLocalStream(null);
    setParticipants([]);
    setCamOn(false);
    setMicOn(false);

    navigate("/home");
  };
  /*
  // Callback to receive translated sentence from VideoTile
  const handleTranslatedSentence = (sentence) => {
    appendMessage("You", sentence, "pink");
  };
  */

  useEffect(() => {
    window.__meeting = { localStreamRef };
    return () => { delete window.__meeting; };
  }, []);

  useEffect(() => {
    const baseStream = localStreamRef.current;
    if (!baseStream) return;

    if (!camOn) {
      disableCamera();
      return;
    }

    enableCamera();
  }, [camOn, disableCamera, enableCamera]);

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
                    picture={p.picture}
                    isLocal={p.isLocal}
                    gestureOn={gestureOn}
                    cameraOn={p.isLocal ? camOn : undefined}
                    badgeText={p.isLocal ? "You" : "Participant"}
                    meetingId={meetingId} 
                    /// onTranslatedSentence={handleTranslatedSentence} // Pass callback
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