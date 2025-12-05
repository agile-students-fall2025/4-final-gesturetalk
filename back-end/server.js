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
import generateSentenceFromSigns from "./src/translation/sentenceGenerator.js";
import auth from "./src/middleware/auth.js";
import { translateValidation } from "./src/middleware/validators.js";
import { saveTranslationLog } from "./src/controllers/translationLogController.js";
import MeetingRoom from "./src/models/MeetingRoom.js";

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
app.use("/api/meetings", auth, meetingRoutes);

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

app.post("/api/translate", auth, translateValidation, async (req, res) => {
  try {
    const { signedWords, meetingId, userName } = req.body;

    if (!Array.isArray(signedWords) || signedWords.length === 0) {
      return res
        .status(400)
        .json({ error: "signedWords must be a non-empty array of strings" });
    }
    if (!meetingId) {
      return res.status(400).json({ error: "meetingId is required" });
    }

    const sentence = await generateSentenceFromSigns(signedWords);
    await saveTranslationLog({
      meetingId,
      message: sentence,
      user: userName || "Guest",
    });

    console.log(`✅ Translation log saved for meeting ${meetingId}`);

    io.to(meetingId).emit("new-translation", {
      userName: userName || "Guest",
      sentence,
      timestamp: new Date().toISOString(),
    });

    res.json({ sentence });
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
    origin: `${process.env.CORS_ORIGIN}`, // front-end runs on 3000
    methods: ["GET", "POST"],
  },
});

// Track which room each peer is in
const peers = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // Join a room
  socket.on("join-room", async ({ meetingId }) => {
    const roomID = meetingId;
    peers[socket.id] = roomID;
    socket.join(roomID);

    // User join room, increment count
    // Emit as object (front-end expects data.socketId)
    socket.to(roomID).emit("user-joined", { socketId: socket.id });
    const meetingRoom = await MeetingRoom.findOneAndUpdate(
      { meetingCode: roomID },
      { $inc: { participantCount: 1 } },
      { new: true },
    );
    console.log(
      `Meeting Room Participant Count: ${meetingRoom.participantCount}`,
    );
    console.log("Updated Meeting Room", meetingRoom);
    console.log(`Socket ${socket.id} joined room ${roomID}`);
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
  socket.on("disconnect", async () => {
    console.log("Disconnected:", socket.id);
    const roomID = peers[socket.id];
    delete peers[socket.id];
    if (roomID) {
      socket.to(roomID).emit("user-left", { socketId: socket.id });
      const decrementCount = await MeetingRoom.findOneAndUpdate(
        { meetingCode: roomID },
        { $inc: { participantCount: -1 } },
        { new: true },
      );

      if (decrementCount && decrementCount.participantCount <= 0) {
        await MeetingRoom.deleteOne({ meetingCode: roomID });
        console.log(`Meeting Room ${roomID} deleted. Last participant left.`);
      }
    }
  });
});

// ---- Error middleware ----

function error(err, req, res, next) {
  console.error(err.stack);
  if (res && typeof res.status === "function") {
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}

app.use(error);

// ---- Start server (but not during tests) ----

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}`);
  });
}
