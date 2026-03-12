import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../lib/db";
import User from "../models/User";

async function reset() {
  console.log("🚀 Starting Admin Password Reset...");
  await connectDB();

  const newPassword = "Varanasi@2026"; // You can change this to whatever you want
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const result = await User.updateOne(
    { email: "owner@varanasirentals.com" },
    { $set: { password: hashedPassword } }
  );

  if (result.matchedCount === 0) {
    console.log("❌ Error: Admin account not found in database.");
  } else {
    console.log("✅ Success! Password has been reset.");
    console.log("-----------------------------------------");
    console.log("📧 Email: owner@varanasirentals.com");
    console.log("🔑 New Password: " + newPassword);
    console.log("-----------------------------------------");
  }

  process.exit(0);
}

reset().catch(err => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
