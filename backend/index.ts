import { Server } from "socket.io";
//import { createClient } from "redis";
import { setupSocketHandlers } from "./src/sockets/event";

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

const io = new Server(4000, {
  cors: { 
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

//const redisClient = createClient({ url: process.env.REDIS_URL });

async function start() {
  // Comment out the Redis connection until the Redis container is running
  // await redisClient.connect(); 
  
  console.log("Socket.io server listening on port 4000");

  setupSocketHandlers(io);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

start();