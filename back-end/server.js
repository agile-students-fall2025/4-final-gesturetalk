import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

dotenv.config(); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
});

io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("message", (message) => {
    socket.broadcast.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
});

function error(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
}

app.use(error);

server.listen(5000, () => {
  console.log(`Listening on Port 5000`);
});
