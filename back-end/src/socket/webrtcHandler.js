// Events: join-room, offer, answer, ice, captions

const peers = {}

const regWebRTCHandlers = (io, socket) => {
    // join-room
    socket.on("join-room", (roomId) => {
        peers[socket.id] = roomId
        socket.join(roomId)
        console.log(`Socket: ${socket.id} joined Room: ${roomId}`)
        // emit to peers
        socket.to(roomId).emit("user-joined", socket.id)
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
    // !!! How are we determining when a user is done with signing?
    // currently thinking of time delay when signed (maybe like 5 secs?), 
    // then translation shows & get broadcast
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