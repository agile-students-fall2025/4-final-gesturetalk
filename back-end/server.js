import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import authRoutes from "./src/routes/authRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// __dirname / __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/* ------------------- MongoDB Connection ------------------- */
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://wht7519:testtest@cluster0.qok6wpj.mongodb.net/?appName=Cluster0";

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* ------------------- Routes ------------------- */
app.use("/api/auth", authRoutes);

/* ------------------- HTTP + Socket.io ------------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // front-end runs on 3000
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // ---- Join a meeting room (with metadata) ----
  socket.on("join-room", ({ meetingId, userId, profile } = {}) => {
    if (!meetingId) return;

    socket.join(meetingId);
    socket.meetingId = meetingId;
    socket.userId = userId || null;

    // Notify other participants that a user joined
    socket.to(meetingId).emit("user-joined", {
      userId: socket.userId,
      profile: profile || null,
      socketId: socket.id,
    });

    // If room has at least 2 participants, emit 'ready'
    const room = io.sockets.adapter.rooms.get(meetingId);
    const count = room ? room.size : 0;
    if (count >= 2) {
      io.in(meetingId).emit("ready", { meetingId, count });
    }
  });

  // ---- Explicit leave-room ----
  socket.on("leave-room", ({ meetingId, userId } = {}) => {
    const m = meetingId || socket.meetingId;
    if (!m) return;

    socket.leave(m);
    socket.to(m).emit("user-left", {
      userId: socket.userId || userId,
      socketId: socket.id,
    });
  });

  // ---- Generic message within a meeting ----
  socket.on("message", (message = {}) => {
    const meetingId = message.meetingId || socket.meetingId;
    if (meetingId) {
      socket.to(meetingId).emit("message", message);
    } else {
      // fallback broadcast if no room
      socket.broadcast.emit("message", message);
    }
  });

  // ---- WebRTC signaling: Offer / Answer / ICE ----
  // These are routed to specific socket IDs
  socket.on("offer", (data = {}) => {
    const { target, sdp } = data;
    if (!target) return;
    console.log(`Offer from ${socket.id} to ${target}`);
    io.to(target).emit("offer", { sdp, sender: socket.id });
  });

  socket.on("answer", (data = {}) => {
    const { target, sdp } = data;
    if (!target) return;
    console.log(`Answer from ${socket.id} to ${target}`);
    io.to(target).emit("answer", { sdp, sender: socket.id });
  });

  socket.on("ice-candidate", (data = {}) => {
    const { target, candidate, sdpMid, sdpMLineIndex } = data;
    if (!target) return;
    console.log(`ICE candidate from ${socket.id} to ${target}`);
    io.to(target).emit("ice-candidate", {
      candidate,
      sdpMid,
      sdpMLineIndex,
      sender: socket.id,
    });
  });

  // ---- Disconnect ----
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    if (socket.meetingId) {
      socket.to(socket.meetingId).emit("user-left", {
        userId: socket.userId,
        socketId: socket.id,
      });
    }
  });
});

/* ------------------- Error Handler ------------------- */
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
}

app.use(errorHandler);

/* ------------------- Start Server ------------------- */
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
