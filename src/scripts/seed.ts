import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import connectDB from "../lib/db";

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  try {
    await connectDB();
    console.log("Connected to MongoDB...");

    const ownerExists = await User.findOne({ role: "Owner" });

    if (ownerExists) {
      console.log("⚠️  An Owner account already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const owner = new User({
      name: "Owner",
      email: "owner@varanasirentals.com",
      password: hashedPassword,
      role: "Owner",
    });

    await owner.save();
    console.log("✅ Owner account created successfully!");
    console.log("📧 Email: owner@varanasirentals.com");
    console.log("🔑 Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
