import http from "http";
import app from "./src/app.js";
import envConfig from "./src/config/envConfig.js";
import { connectDB } from "./src/config/db.js";
import { initSocket } from "./src/sockets/server.socket.js";
import redis from "./src/config/cache.js";

// Database Connection
connectDB();

// Attach Redis to app locals
app.locals.redis = redis;

// Create HTTP Server
const server = http.createServer(app);

// Bind Socket.io to server
initSocket(server);

// Start Server
server.listen(envConfig.PORT, () => {
  console.log(`PustakMart server is running on port ${envConfig.PORT}`);
});