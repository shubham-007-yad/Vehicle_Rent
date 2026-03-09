import mongoose from "mongoose";
import connectDB from "../lib/db";
import User from "../models/User";

async function migrate() {
  console.log("🚀 Starting Role Migration...");
  await connectDB();

  // 1. Update Owners to admin
  const admins = await User.updateMany(
    { role: { $in: ["Owner", "admin", "Admin"] } },
    { $set: { role: "admin" } }
  );
  console.log(`✅ Updated ${admins.modifiedCount} accounts to 'admin' role.`);

  // 2. Update Staff to staff
  const staff = await User.updateMany(
    { role: { $in: ["Staff", "staff"] } },
    { $set: { role: "staff" } }
  );
  console.log(`✅ Updated ${staff.modifiedCount} accounts to 'staff' role.`);

  console.log("✨ Migration Complete! You can now delete this script.");
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
