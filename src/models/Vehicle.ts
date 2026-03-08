import mongoose, { Schema, Document } from "mongoose";

export interface IVehicle extends Omit<Document, 'model'> {
  make: string;
  model: string;
  plateNumber: string;
  type: "Scooter" | "Bike" | "Car";
  baseRatePerDay: number;
  status: "Available" | "On-Trip" | "Maintenance";
  lastKmReading: number;
  fuelLevel: number;
  lastServiceKm: number;
  insuranceExpiry: Date;
  pucExpiry: Date;
  rcUrl?: string;
  insuranceUrl?: string;
  documents?: { name: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema(
  {
    make: { type: String, required: true },
    model: { type: String, required: true },
    plateNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ["Scooter", "Bike", "Car"], required: true },
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
    rcUrl: { type: String },
    insuranceUrl: { type: String },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);
