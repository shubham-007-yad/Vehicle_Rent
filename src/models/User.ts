import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "Owner" | "Staff";
  phone?: string;
  profilePictureUrl?: string;
  profileBannerUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed password
    role: { type: String, enum: ["Owner", "Staff"], default: "Staff" },
    phone: { type: String },
    profilePictureUrl: { type: String },
    profileBannerUrl: { type: String },
    bio: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
