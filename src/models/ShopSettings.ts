import mongoose, { Schema, Document } from "mongoose";

export interface IDamageItem {
  name: string;
  price: number;
}

export interface IShopSettings extends Document {
  shopName: string;
  ownerPhone: string;
  address: string;
  gstNumber?: string;
  defaultDepositScooter: number;
  defaultDepositBike: number;
  defaultDepositCar: number;
  lateFeePerHour: number;
  damageCatalog: IDamageItem[];
  whatsappNotification: boolean;
  currencySymbol: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSettingsSchema: Schema = new Schema(
  {
    shopName: { type: String, required: true, default: "Varanasi Rentals" },
    ownerPhone: { type: String, required: true, default: "" },
    address: { type: String, required: true, default: "" },
    gstNumber: { type: String },
    defaultDepositScooter: { type: Number, default: 1000 },
    defaultDepositBike: { type: Number, default: 2000 },
    defaultDepositCar: { type: Number, default: 5000 },
    lateFeePerHour: { type: Number, default: 100 },
    damageCatalog: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    whatsappNotification: { type: Boolean, default: true },
    currencySymbol: { type: String, default: "₹" },
  },
  { timestamps: true }
);

export default mongoose.models.ShopSettings || mongoose.model<IShopSettings>("ShopSettings", ShopSettingsSchema);
