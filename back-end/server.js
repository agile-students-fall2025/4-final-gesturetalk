import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./src/routes/authRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import callHistoryRoutes from "./src/routes/callHistoryRoutes.js";
import translationLogRoutes from "./src/routes/translationLogRoutes.js";
import meetingRoutes from "./src/routes/meetingRoutes.js";
import { generateSentenceFromSigns } from "./src/translation/sentenceGenerator.js";
import auth from "./src/middleware/auth.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Exported app for tests
export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// JWT body parsing
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

app.use(cors());

// ---- Routes ----

// Auth routes
app.use("/api/auth", authRoutes);

// Profile routes + auth middleware
app.use("/api/profile", auth, profileRoutes);

// Call history routes + auth middleware
app.use("/api/call-history", auth, callHistoryRoutes);

// Translation log routes + auth middleware
app.use("/api/translation-log", auth, translationLogRoutes);

// Meeting create/join routes
app.use("/api/meetings", meetingRoutes);

// ---- Static uploads ----

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const profilesDir = path.join(uploadsDir, "profiles");
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// ---- Sentence translation route ----

app.post("/api/translate", async (req, res) => {
  try {
    const { signedWords } = req.body;

    if (!Array.isArray(signedWords) || signedWords.length === 0) {
      return res
        .status(400)
        .json({ error: "signedWords must be a non-empty array of strings" });
    }

    const sentence = await generateSentenceFromSigns(signedWords);
    res.json({ sentence });
    return;
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

// ---- MongoDB connection ----

const { MONGODB_URI } = process.env;

// Only connect to MongoDB when NOT running tests
if (process.env.NODE_ENV !== "test") {
  if (MONGODB_URI) {
    mongoose
      .connect(MONGODB_URI)
      .then(() => console.log("MongoDB connected"))
      .catch((err) => console.error("MongoDB connection error:", err));
  } else {
    console.warn(
      "MONGODB_URI not set; auth endpoints will fail until configured",
    );
  }
}

// ---- HTTP server + Socket.io ----

// Exported server and io for potential socket tests
export const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // front-end runs on 3000
    methods: ["GET", "POST"],
  },
});

// Track which room each peer is in
const peers = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // Join a room
  socket.on("join-room", (roomID) => {
    peers[socket.id] = roomID;
    socket.join(roomID);
    console.log(`Socket ${socket.id} joined room ${roomID}`);
    socket.to(roomID).emit("user-joined", socket.id);
  });

  // Offer → specific target peer
  socket.on("offer", (data) => {
    const { target, sdp } = data;
    console.log(`Offer from ${socket.id} to ${target}`);
    io.to(target).emit("offer", { sdp, sender: socket.id });
  });

  // Answer → specific target peer
  socket.on("answer", (data) => {
    const { target, sdp } = data;
    console.log(`Answer from ${socket.id} to ${target}`);
    io.to(target).emit("answer", { sdp, sender: socket.id });
  });

  // ICE candidate → specific target peer
  socket.on("ice-candidate", (data) => {
    const { target, candidate, sdpMid, sdpMLineIndex } = data;
    console.log(`ICE candidate from ${socket.id} to ${target}`);
    io.to(target).emit("ice-candidate", {
      candidate,
      sdpMid,
      sdpMLineIndex,
      sender: socket.id,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    const roomID = peers[socket.id];
    delete peers[socket.id];
    if (roomID) {
      socket.to(roomID).emit("user-disconnected", socket.id);
    }
  });
});

// ---- Error middleware ----

function error(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
}

app.use(error);

// ---- Start server (but not during tests) ----

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}`);
  });
}
