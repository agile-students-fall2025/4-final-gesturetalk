// Initializes Socket.IO

import { Server } from "socket.io";
import regWebRTCHandlers from "./webrtcHandler.js";

let io = null;

export function regSocketServer(server) {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:3000", // this needs to be changed later to include our deployed URL
            methods: ["GET", "POST"]

        }
    })

    io.on("connection" , (socket) => {
        console.log(`connected user: ${socket.id}`)
        regWebRTCHandlers(io, socket);

        socket.on("disconnect", ()=>{
            console.log(`user disconnect: ${socket.id}`)
        })
    })
}

export function getIO() {
  return io;
}