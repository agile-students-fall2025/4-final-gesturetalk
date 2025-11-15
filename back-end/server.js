import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import authRoutes from "./src/routes/authRoutes.js";

dotenv.config(); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://wht7519:<db_password>@cluster0.qok6wpj.mongodb.net/?appName=Cluster0";
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mount auth routes
app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // Join a meeting room
  socket.on('join-room', ({ meetingId, userId, profile } = {}) => {
    if (!meetingId) return;
    socket.join(meetingId);
    socket.meetingId = meetingId;
    socket.userId = userId || null;

    // Notify other participants in the room that a user joined
    socket.to(meetingId).emit('user-joined', { userId: socket.userId, profile: profile || null });

    // If room has at least 2 participants, emit ready so peers can negotiate
    const room = io.sockets.adapter.rooms.get(meetingId);
    const count = room ? room.size : 0;
    if (count >= 2) {
      io.in(meetingId).emit('ready', { meetingId, count });
    }
  });
  
  // Allow clients to explicitly leave a room
  socket.on('leave-room', ({ meetingId, userId } = {}) => {
    const m = meetingId || socket.meetingId;
    if (!m) return;
    socket.leave(m);
    socket.to(m).emit('user-left', { userId: socket.userId || userId });
  });

  // Route signaling messages to other participants in the same meeting only
  socket.on("message", (message = {}) => {
    const meetingId = message.meetingId || socket.meetingId;
    if (meetingId) {
      // send to others in the same room
      socket.to(meetingId).emit('message', message);
    } else {
      // fallback for messages without room (broadcast)
      socket.broadcast.emit("message", message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    if (socket.meetingId) {
      socket.to(socket.meetingId).emit('user-left', { userId: socket.userId });
    }
  });
});

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
