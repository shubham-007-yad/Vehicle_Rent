import mongoose, { Schema, Document } from "mongoose";

export interface IVehicle extends Document {
  make: string;
  model: string;
  plateNumber: string;
  type: "Scooter" | "Bike";
  baseRatePerDay: number;
  status: "Available" | "On-Trip" | "Maintenance";
  lastKmReading: number;
  fuelLevel: number;
  lastServiceKm: number;
  insuranceExpiry: Date;
  pucExpiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    plateNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ["Scooter", "Bike"], required: true },
    baseRatePerDay: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Available", "On-Trip", "Maintenance"],
      default: "Available",
    },
    lastKmReading: { type: Number, required: true, default: 0 },
    fuelLevel: { type: Number, required: true, default: 100 },
    lastServiceKm: { type: Number, required: true, default: 0 },
    insuranceExpiry: { type: Date },
    pucExpiry: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);
