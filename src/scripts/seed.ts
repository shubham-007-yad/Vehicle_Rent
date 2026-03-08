import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Vehicle from "../models/Vehicle";
import Rental from "../models/Rental";
import connectDB from "../lib/db";

const sampleVehicles = [
  {
    make: "Royal Enfield",
    model: "Hunter 350",
    plateNumber: "UP65 AB 1234",
    type: "Bike",
    baseRatePerDay: 800,
    status: "Available",
    lastKmReading: 1250,
    fuelLevel: 80,
    lastServiceKm: 0,
    insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    pucExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    rcUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    insuranceUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    make: "Royal Enfield",
    model: "Classic 350",
    plateNumber: "UP65 XY 5678",
    type: "Bike",
    baseRatePerDay: 1000,
    status: "On-Trip",
    lastKmReading: 4500,
    fuelLevel: 40,
    lastServiceKm: 1000,
    insuranceExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    pucExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    rcUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    insuranceUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    make: "Honda",
    model: "Activa 6G",
    plateNumber: "UP65 CD 9012",
    type: "Scooter",
    baseRatePerDay: 400,
    status: "Available",
    lastKmReading: 8900,
    fuelLevel: 95,
    lastServiceKm: 5000,
    insuranceExpiry: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
    pucExpiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    rcUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    insuranceUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    make: "Honda",
    model: "Dio",
    plateNumber: "UP65 JK 1122",
    type: "Scooter",
    baseRatePerDay: 350,
    status: "On-Trip",
    lastKmReading: 15600,
    fuelLevel: 50,
    lastServiceKm: 14000,
    insuranceExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    pucExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    rcUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    insuranceUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  }
];

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  try {
    await connectDB();
    console.log("Connected to MongoDB...");

    // 1. Seed Owner
    const ownerExists = await User.findOne({ role: "Owner" });
    if (!ownerExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const owner = new User({
        name: "Owner",
        email: "owner@varanasirentals.com",
        password: hashedPassword,
        role: "Owner",
      });
      await owner.save();
      console.log("✅ Owner account created successfully!");
    }

    // 2. Seed Vehicles
    await Vehicle.deleteMany({});
    const vehicles = await Vehicle.insertMany(sampleVehicles);
    console.log(`✅ ${sampleVehicles.length} Sample vehicles added!`);

    // 3. Seed Active Rentals for the 2 bikes marked 'On-Trip'
    await Rental.deleteMany({});
    const classic350 = vehicles.find(v => v.model === "Classic 350");
    const dio = vehicles.find(v => v.model === "Dio");
    
    if (classic350) {
      await Rental.create({
        customerName: "Rahul Sharma",
        customerPhone: "9876543210",
        idPhotoUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        vehicleId: classic350._id,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
        expectedEndTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // Overdue
        startKm: 4400,
        startFuel: 50,
        depositAmount: 2000,
        baseRateAtBooking: 1000,
        totalAmount: 1000,
        status: "Active",
        paymentStatus: "Pending"
      });
    }

    if (dio) {
      await Rental.create({
        customerName: "Amit Kumar",
        customerPhone: "8888877777",
        idPhotoUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        vehicleId: dio._id,
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // Started 4h ago
        expectedEndTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Due in 20 days
        startKm: 15550,
        startFuel: 80,
        depositAmount: 1000,
        baseRateAtBooking: 350,
        totalAmount: 350,
        status: "Active",
        paymentStatus: "Paid"
      });
    }

    console.log("✅ 2 Active Rentals seeded correctly!");
    console.log("-----------------------------------------");
    console.log("📧 Email: owner@varanasirentals.com");
    console.log("🔑 Password: admin123");
    console.log("-----------------------------------------");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
