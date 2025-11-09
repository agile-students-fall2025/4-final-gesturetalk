import app from './app.js'
import http from "http";
import { regSocketServer } from "./src/socket/index.js";

// attach socket to the server
const server = http.createServer(app);
regSocketServer(server);

const PORT = process.env.PORT || 3000; // change this later when deploy

const listener = server.listen(PORT, function () {
  console.log(`Server running on port: ${PORT}`)
})

const close = () => {
  listener.close()
}

export { close }