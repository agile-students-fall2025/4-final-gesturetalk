// Initializes Socket.IO

import { Server } from "socket.io";
import regWebRTCHandler from "./webrtcHandler";

let io = null;

const regSocketServer = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:3000", // this needs to be changed later to include our deployed URL
            methods: [get, POST]

        }
    })

    io.on("connnection" , (socket) => {
        console.log(`connected user: ${socket.id}`)
        regWebRTCHandler(socket, io)

        socket.on("disconnect", ()=>{
            console.log(`user disconnect: ${socket.id}`)
        })
    })
}

export default {
    regSocketServer,
    getIO: () => io
}