import { Server } from "socket.io";
import { createClient } from "redis";
import { canJoinGame, GameState } from "@shared/gameLogic.js";

const io = new Server(4000, {
  cors: { origin: "*" }
});

const mockState: GameState = {
  players: ["Player 1"],
  status: "waiting"
};



const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("error", (err) => console.log("Redis Client Error", err));

async function start() {
  // Comment out the Redis connection until the Redis container is running
  // await redisClient.connect(); 
  
  console.log("Socket.io server listening on port 4000");

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

start();