import mongoose, { Schema, Document } from "mongoose";

export interface IRental extends Document {
  customerName: string;
  customerPhone: string;
  aadhaarNumber?: string;
  dlNumber?: string;
  idPhotoUrl: string; // Cloudinary URL
  vehicleId: mongoose.Types.ObjectId;
  startTime: Date;
  expectedEndTime: Date;
  actualEndTime?: Date;
  startKm: number;
  endKm?: number;
  startFuel: number;
  endFuel?: number;
  depositAmount: number;
  baseRateAtBooking: number;
  lateFees: number;
  damageCharges: number;
  fuelCharges: number;
  totalAmount: number;
  paymentStatus: "Pending" | "Paid";
  status: "Active" | "Completed" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const RentalSchema: Schema = new Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    aadhaarNumber: { type: String },
    dlNumber: { type: String },
    idPhotoUrl: { type: String, required: true }, // Cloudinary URL
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    startTime: { type: Date, default: Date.now, required: true },
    expectedEndTime: { type: Date, required: true },
    actualEndTime: { type: Date },
    startKm: { type: Number, required: true },
    endKm: { type: Number },
    startFuel: { type: Number, required: true },
    endFuel: { type: Number },
    depositAmount: { type: Number, required: true, default: 0 },
    baseRateAtBooking: { type: Number, required: true },
    lateFees: { type: Number, default: 0 },
    damageCharges: { type: Number, default: 0 },
    fuelCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Rental || mongoose.model<IRental>("Rental", RentalSchema);
