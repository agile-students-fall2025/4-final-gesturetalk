import express from "express";
import bodyParser from 'body-parser';
import axios from "axios";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from 'mongoose';
import authRoutes from './src/routes/authRoutes.js';
import callHistoryRoutes from './src/routes/callHistoryRoutes.js';
import translationLogRoutes from './src/routes/translationLogRoutes.js';
import path from "path";
import { fileURLToPath } from "url";
import { generateSentenceFromSigns } from "./src/translation/sentenceGenerator.js";

dotenv.config(); 


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// jwt token
app.use(bodyParser.json({limit: "30mb", extended: true}));
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));

app.use(cors());

// Mount auth routes
app.use('/api/auth', authRoutes);
// Call history routes
app.use('/api/call-history', callHistoryRoutes);
// Translation Log routes
app.use('api/translation-log', translationLogRoutes);

// --- Sentence translation route ---
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
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});


// Connect to MongoDB if URI provided
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI).then(() => console.log('MongoDB connected')).catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGODB_URI not set; auth endpoints will fail until configured');
}



const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",  // front-end runs on 3000
    methods: ["GET", "POST"]
  },
});

// Track which room each peer is in
const peers = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // ---- Join a room ----
  socket.on("join-room", (roomID) => {
    peers[socket.id] = roomID;
    socket.join(roomID);
    console.log(`Socket ${socket.id} joined room ${roomID}`);
    // Notify other peers in the room that a new user joined
    socket.to(roomID).emit("user-joined", socket.id);
  });

  // ---- Offer: route to specific target peer ----
  socket.on("offer", (data) => {
    const { target, sdp } = data;
    console.log(`Offer from ${socket.id} to ${target}`);
    io.to(target).emit("offer", { sdp, sender: socket.id });
  });

  // ---- Answer: route to specific target peer ----
  socket.on("answer", (data) => {
    const { target, sdp } = data;
    console.log(`Answer from ${socket.id} to ${target}`);
    io.to(target).emit("answer", { sdp, sender: socket.id });
  });

  // ---- ICE Candidate: route to specific target peer ----
  socket.on("ice-candidate", (data) => {
    const { target, candidate, sdpMid, sdpMLineIndex } = data;
    console.log(`ICE candidate from ${socket.id} to ${target}`);
    io.to(target).emit("ice-candidate", {
      candidate,
      sdpMid,
      sdpMLineIndex,
      sender: socket.id
    });
  });

  // ---- Disconnect ----
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    const roomID = peers[socket.id];
    delete peers[socket.id];
    if (roomID) {
      socket.to(roomID).emit("user-disconnected", socket.id);
    }
  });
});

function error(err, req, res, next) {b
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
}

app.use(error);


server.listen(3001, () => {
  console.log(`Listening on Port 3001`);
});
