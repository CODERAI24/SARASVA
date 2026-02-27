import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.warn("Running without database — all DB operations will fail until MongoDB is available.");
    // Do NOT exit: let Express start so you can test routes and UI wiring
    return;
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected.");
  });
}
