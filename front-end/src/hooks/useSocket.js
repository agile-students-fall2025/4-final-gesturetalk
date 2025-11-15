// custom React hook 
// connect to backend Socket.IO Server & define helper functions
import { useEffect, useRef }  from "react";
import { io } from "socket.io-client";

export const useSocket = () => {
    const socketRef = useRef(null);

    // initialize socket only once
    if (!socketRef.current) {
        // create connection to backend server
        socketRef.current = io("http://localhost:3000");
    }
    
    const socket = socketRef.current;

    // clean up when component unmounts
    useEffect(() => {
        return () => {
            socket.disconnect();
        };
    }, []);

    
    // -------------------------------
    //  Helper functions
    // -------------------------------

    // ---- Emitters ----

    const joinRoom = (roomId) =>
        socket.emit("join-room", roomId);

    const sendOffer = (target, sdp) =>
        socket.emit("offer", { target, sdp });

    const sendAnswer = (target, sdp) =>
        socket.emit("answer", { target, sdp });

    const sendICECandidate = (target, candidate) =>
        socket.emit("ice-candidate", { target, sdp: candidate });

    const sendCaptions = (text) =>
        socket.emit("captions", text);

    // ---- Listeners ----

    const onUserJoined = (cb) =>
        socket.on("user-joined", cb);

    const onOffer = (cb) =>
        socket.on("offer", cb);

    const onAnswer = (cb) =>
        socket.on("answer", cb);

    const onICECandidate = (cb) =>
        socket.on("ice-candidate", cb);

    const onCaptions = (cb) =>
        socket.on("captions", cb);

    const onUserDisconnected = (cb) =>
        socket.on("user-disconnected", cb);




    // return socket instance + helpers + event hooks
    return {
        socket,

        // sending events
        joinRoom,
        sendOffer,
        sendAnswer,
        sendICECandidate,
        sendCaptions,

        // receiving events
        onUserJoined,
        onOffer,
        onAnswer,
        onICECandidate,
        onCaptions,
        onUserDisconnected

    };


};
