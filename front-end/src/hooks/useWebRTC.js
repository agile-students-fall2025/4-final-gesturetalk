// handles webRTC peer connection
// uses functions exposed by useSocket.js
import { useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";
import { rtcConfig } from "../utils/rtcConfig";

export const useWebRTC = (roomID) => {
    const {
        socket,
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

    // Stores multiple peer connections: { socketId: RTCPeerConnection }
    const peerConnections = useRef({});
    const localStreamRef = useRef(null);    // MediaStream from getUserMedia
    // Stores multiple remote streams: { socketId: MediaStream }
    const [remoteStreams, setRemoteStreams] = useState({});
    const [inCall, setInCall] = useState(false);

    // initialize RTCPeerConnection + local media (videa & audio)
    // run once on mount

    useEffect(() => {
        let isMounted = true;

        const setup = async () => {
            // get camera & mic
            const localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            if (!isMounted) return;

            localStreamRef.current = localStream;

            // join the room
            if (roomID) joinRoom(roomID);
        };

        // call setup()
        setup();

        // clean up when component unmounts
        return () => {
            isMounted = false;

            // close all peer connections
            Object.values(peerConnections.current).forEach(pc => pc.close());
            peerConnections.current = {};

            // stop camera & mic
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }

            setRemoteStreams({});
            setInCall(false);
        };
    }, [roomID, joinRoom]);

    // peer connection per socketId
    const createPeerConnection = (socketId) => {
        console.log("Creating new RTCPeerConnection for:", socketId);

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnections.current[socketId] = pc;

        // add local tracks to curr pc
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        } else {
            console.warn("Local stream not ready yet when creating PC:", socketId);
        }

        // receive remote stream
        pc.ontrack = (event) => {
            const [stream] = event.streams;

            setRemoteStreams(prev => ({
                ...prev,
                [socketId]: stream
            }));

            setInCall(true);
        };

        // when discover ICE → send to specific peer
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendICECandidate(socketId, event.candidate);
            }
        };

        return pc;
    };

    // when someone joins -> send them an offer
    useEffect(() => {
        const handleUserJoined = async (newUserId) => {
            console.log("User joined:", newUserId);

            const pc = createPeerConnection(newUserId);

            // caller sends offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            sendOffer(newUserId, offer);
        };

        onUserJoined(handleUserJoined);

        return () => {
            socket.off("user-joined", handleUserJoined);
        };
    }, []);

    // when receive an offer -> create answer
    useEffect(() => {
        const handleOffer = async ({ sdp, sender }) => {
            console.log("Received OFFER from:", sender);

            // create or retrieve pc
            const pc =
                peerConnections.current[sender] ||
                createPeerConnection(sender);

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            sendAnswer(sender, answer);
        };

        onOffer(handleOffer);

        return () => {
            socket.off("offer", handleOffer);
        };
    }, []);

    // when receive an answer -> sets remoteDescription = answer
    useEffect(() => {
        const handleAnswer = async ({ sdp, sender }) => {
            console.log("Received ANSWER from:", sender);

            const pc = peerConnections.current[sender];
            if (!pc) return;

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        };

        onAnswer(handleAnswer);

        return () => {
            socket.off("answer", handleAnswer);
        };
    }, []);

    // when receive ICE
    useEffect(() => {
        const handleICE = async ({ sdp, sender }) => {
            console.log("Received ICE from:", sender);

            const pc = peerConnections.current[sender];
            if (!pc) return;

            try {
                await pc.addIceCandidate(new RTCIceCandidate(sdp));
            } catch (e) {
                console.error("Error adding ICE:", e);
            }
        };

        onICECandidate(handleICE);

        return () => {
            socket.off("ice-candidate", handleICE);
        };
    }, []);

    // handle user disconnect
    useEffect(() => {
        const handleUserDisconnected = (socketId) => {
            console.log("Peer disconnected:", socketId);

            if (peerConnections.current[socketId]) {
                peerConnections.current[socketId].close();
                delete peerConnections.current[socketId];
            }

            setRemoteStreams(prev => {
                const copy = { ...prev };
                delete copy[socketId];
                return copy;
            });
        };

        onUserDisconnected(handleUserDisconnected);

        return () => {
            socket.off("user-disconnected", handleUserDisconnected);
        };
    }, []);

    // return what UI needs
    return {
        localStream: localStreamRef.current,
        remoteStreams,   // dictionary of remote media streams
        inCall
    };
};