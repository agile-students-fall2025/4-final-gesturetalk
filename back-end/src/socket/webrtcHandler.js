// Events: join-room, offer, answer, ice, captions

const peers = {}

const regWebRTCHandlers = (io, socket) => {
    // join-room
    socket.on("join-room", (roomID) => {
        peers[socket.id] = roomID
        socket.join(roomID)
        console.log(`Socket: ${socket.id} joined Room: ${roomID}`)
        // emit to peers
        socket.to(roomID).emit("user-joined", socket.id)
    })

    // offer
    socket.on("offer", (data) => {
        const {target, sdp} = data
        io.to(target).emit("offer", {sdp, sender: socket.id})
    })

    // answer
    socket.on("answer", (data) => {
        const {target, sdp} = data
        io.to(target).emit("answer", {sdp, sender: socket.id})
    })

    // ice
    socket.on("ice-candidate", (data) => {
        const {target, sdp} = data
        io.to(target).emit("ice-candidate", {sdp, sender: socket.id})
    })

    // broadcasting translated captions
    socket.on("captions", (text) => {
        const roomID = peers[socket.id]
        if (roomID){
            console.log(`Translation from Socket ${socket.id}: ${text}`)
            socket.to(roomID).emit("captions", {
                sender: socket.id,
                text
            })
        }
    })

    // disconnecting
    socket.on("disconnect", () =>{
        const roomID = peers[socket.id]
        delete peers[socket.id]
        if (roomID){
            socket.to(roomID).emit("user-disconnected", socket.id)
        }
    })

}

export default regWebRTCHandlers;