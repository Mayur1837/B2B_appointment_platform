// import mongoose from 'mongoose';
// import { env } from './env.js';

// export async function connectDb() {
//   await mongoose.connect(env.mongoUri);
//   console.log('MongoDB connected');
// }
import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}
