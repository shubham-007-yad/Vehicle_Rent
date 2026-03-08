import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000, // Increased to 15 seconds
      connectTimeoutMS: 15000,         // Wait 15 seconds for initial connection
      socketTimeoutMS: 45000,          // Close inactive sockets after 45s
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected Successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error("❌ MONGODB CONNECTION ERROR:", e.message);
    if (e.name === 'MongooseServerSelectionError') {
      throw new Error("DATABASE CONNECTION FAILED: Your IP might not be whitelisted in MongoDB Atlas. Please check your Network Access settings.");
    }
    throw e;
  }

  return cached.conn;
}

export default connectDB;
