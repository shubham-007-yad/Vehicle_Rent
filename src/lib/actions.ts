"use server";

import { signOut } from "@/auth";
import connectDB from "@/lib/db";
import Vehicle from "@/models/Vehicle";
import Rental from "@/models/Rental";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function handleSignOut() {
  await signOut({ redirectTo: "/login" });
}

export async function uploadImage(base64Image: string) {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "varanasi_rentals_kyc",
    });
    return { url: uploadResponse.secure_url };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return { error: "Failed to upload image to cloud." };
  }
}

export async function uploadFile(file: File, folder: string) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return new Promise<{ url: string; error?: string }>((resolve) => {
      cloudinary.uploader.upload_stream(
        { folder: folder, resource_type: "auto" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            resolve({ error: "Failed to upload file to cloud.", url: "" });
          } else {
            resolve({ url: result?.secure_url || "" });
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error("File processing error:", error);
    return { error: "Failed to process file.", url: "" };
  }
}

export async function createRental(data: any) {
  await connectDB();
  
  try {
    // Ensure nested/date objects are clean
    const rawPhotos = Array.isArray(data.idPhotoUrl) ? data.idPhotoUrl : [data.idPhotoUrl];
    
    // STRICT GUARD: Block any non-https URLs (prevents blob leaks)
    const validPhotos = rawPhotos.filter(url => url.startsWith("https://"));
    
    if (validPhotos.length === 0) {
      return { error: "Permanent KYC photos are required. Please re-snap the photo." };
    }

    const formattedData = {
      ...data,
      startTime: new Date(),
      expectedEndTime: new Date(data.expectedEndTime),
      idPhotoUrl: validPhotos
    };

    // 1. Create Rental Record
    const rental = await Rental.create({
      ...formattedData,
      status: "Active"
    });

    // 2. Update Vehicle Status
    await Vehicle.findByIdAndUpdate(data.vehicleId, {
      status: "On-Trip",
      lastKmReading: data.startKm
    });

    revalidatePath("/dashboard/active-trips");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    return { success: true, id: rental._id.toString() };
  } catch (error: any) {
    console.error("CRITICAL: Failed to create rental:", error);
    // Return the specific mongoose error message if available for debugging
    return { error: error.message || "Could not create rental record. Please try again." };
  }
}

export async function addVehicle(formData: FormData) {
  await connectDB();
  
  const rcFile = formData.get("rcFile") as File;
  const insuranceFile = formData.get("insuranceFile") as File;

  let rcUrl = "";
  let insuranceUrl = "";

  if (rcFile && rcFile.size > 0) {
    const uploadResult = await uploadFile(rcFile, "vehicle_documents");
    if (uploadResult.error) return { error: "Failed to upload RC document." };
    rcUrl = uploadResult.url;
  }

  if (insuranceFile && insuranceFile.size > 0) {
    const uploadResult = await uploadFile(insuranceFile, "vehicle_documents");
    if (uploadResult.error) return { error: "Failed to upload Insurance document." };
    insuranceUrl = uploadResult.url;
  }

  // Handle Extra Documents
  const extraDocNames = formData.getAll("extraDocNames") as string[];
  const extraDocFiles = formData.getAll("extraDocFiles") as File[];
  const documents: { name: string; url: string }[] = [];

  for (let i = 0; i < extraDocNames.length; i++) {
    const file = extraDocFiles[i];
    const name = extraDocNames[i];
    if (file && file.size > 0) {
      const uploadResult = await uploadFile(file, "vehicle_documents");
      if (!uploadResult.error) {
        documents.push({ name, url: uploadResult.url });
      }
    }
  }

  const rawData = {
    make: formData.get("make"),
    model: formData.get("model"),
    plateNumber: formData.get("plateNumber"),
    type: formData.get("type"),
    baseRatePerDay: Number(formData.get("baseRatePerDay")),
    lastKmReading: Number(formData.get("lastKmReading")),
    lastServiceKm: Number(formData.get("lastServiceKm") || formData.get("lastKmReading")),
    insuranceExpiry: new Date(formData.get("insuranceExpiry") as string),
    pucExpiry: new Date(formData.get("pucExpiry") as string),
    rcUrl,
    insuranceUrl,
    documents,
    status: "Available",
    fuelLevel: 100
  };

  try {
    await Vehicle.create(rawData);
  } catch (error) {
    console.error("Failed to create vehicle:", error);
    return { error: "Could not add vehicle. Check if plate number already exists." };
  }

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
  redirect("/dashboard/inventory");
}

export async function updateVehicle(id: string, formData: FormData) {
  await connectDB();
  
  const updates: any = {
    make: formData.get("make"),
    model: formData.get("model"),
    plateNumber: formData.get("plateNumber"),
    status: formData.get("status"),
    baseRatePerDay: Number(formData.get("baseRatePerDay")),
    lastKmReading: Number(formData.get("lastKmReading")),
    lastServiceKm: Number(formData.get("lastServiceKm")),
    insuranceExpiry: new Date(formData.get("insuranceExpiry") as string),
    pucExpiry: new Date(formData.get("pucExpiry") as string),
  };

  const rcFile = formData.get("rcFile") as File;
  const insuranceFile = formData.get("insuranceFile") as File;

  if (rcFile && rcFile.size > 0) {
    const uploadResult = await uploadFile(rcFile, "vehicle_documents");
    if (!uploadResult.error) updates.rcUrl = uploadResult.url;
  }

  if (insuranceFile && insuranceFile.size > 0) {
    const uploadResult = await uploadFile(insuranceFile, "vehicle_documents");
    if (!uploadResult.error) updates.insuranceUrl = uploadResult.url;
  }

  try {
    await Vehicle.findByIdAndUpdate(id, updates);
  } catch (error) {
    console.error("Failed to update vehicle:", error);
    return { error: "Could not update vehicle data." };
  }

  revalidatePath(`/dashboard/inventory/${id}`);
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/active-trips");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteVehicle(id: string) {
  await connectDB();
  
  try {
    await Vehicle.findByIdAndDelete(id);
  } catch (error) {
    console.error("Failed to delete vehicle:", error);
    return { error: "Could not delete vehicle." };
  }

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
  // No redirect here because we'll handle it on the client with toast
  return { success: true };
}

export async function completeRental(rentalId: string, formData: FormData) {
  await connectDB();
  
  try {
    const endKm = Number(formData.get("endKm"));
    const damageCharges = Number(formData.get("damageCharges") || 0);
    const fuelCharges = Number(formData.get("fuelCharges") || 0);
    const lateFees = Number(formData.get("lateFees") || 0);
    const totalAmount = Number(formData.get("totalAmount"));
    const rentPaidAtStart = formData.get("rentPaidAtStart") === "true";
    const adjustFromDeposit = formData.get("adjustFromDeposit") === "true";
    const paymentStatus = formData.get("paymentStatus") as "Pending" | "Paid";

    const rental = await Rental.findById(rentalId);
    if (!rental) return { error: "Rental not found." };

    // Update Rental
    rental.endKm = endKm;
    rental.damageCharges = damageCharges;
    rental.fuelCharges = fuelCharges;
    rental.lateFees = lateFees;
    rental.totalAmount = totalAmount;
    rental.rentPaidAtStart = rentPaidAtStart;
    rental.adjustFromDeposit = adjustFromDeposit;
    rental.paymentStatus = paymentStatus;
    rental.status = "Pending-Payment";
    rental.actualEndTime = new Date();
    await rental.save();

    // Update Vehicle
    await Vehicle.findByIdAndUpdate(rental.vehicleId, {
      status: "Available",
      lastKmReading: endKm
    });

    revalidatePath("/dashboard/active-trips");
    revalidatePath("/dashboard/history");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/insights");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete rental:", error);
    return { error: "Could not complete rental records." };
  }
}

export async function processPayment(rentalId: string, data: {
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending";
  isDepositRefunded: boolean;
}) {
  await connectDB();
  
  try {
    const rental = await Rental.findById(rentalId);
    if (!rental) return { error: "Rental not found." };

    rental.paymentMethod = data.paymentMethod as any;
    rental.paymentStatus = data.paymentStatus;
    rental.isDepositRefunded = data.isDepositRefunded;
    rental.status = "Completed";
    
    await rental.save();

    revalidatePath("/dashboard/history");
    revalidatePath("/dashboard/active-trips");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/insights");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to process payment:", error);
    return { error: "Could not process payment." };
  }
}

export async function getRentalById(id: string) {
  await connectDB();
  try {
    const rental = await Rental.findById(id).populate("vehicleId");
    return { success: true, rental: JSON.parse(JSON.stringify(rental)) };
  } catch (error) {
    return { error: "Rental not found." };
  }
}

export async function getRentalHistory(params?: {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}) {
  await connectDB();
  
  try {
    const { searchQuery, startDate, endDate } = params || {};
    const query: any = { status: "Completed" };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.startTime.$lte = end;
      }
    }

    if (searchQuery) {
      // Find vehicles that match the plateNumber first
      const vehicles = await Vehicle.find({ 
        plateNumber: { $regex: searchQuery, $options: "i" } 
      });
      const vehicleIds = vehicles.map(v => v._id);

      query.$or = [
        { customerName: { $regex: searchQuery, $options: "i" } },
        { customerPhone: { $regex: searchQuery, $options: "i" } },
        { vehicleId: { $in: vehicleIds } }
      ];
    }

    const rentals = await Rental.find(query)
      .populate("vehicleId")
      .sort({ actualEndTime: -1 });

    return { 
      success: true, 
      rentals: JSON.parse(JSON.stringify(rentals)) 
    };
  } catch (error) {
    console.error("Failed to fetch rental history:", error);
    return { error: "Could not fetch rental records." };
  }
}

export async function getRevenueByDateRange(startDate?: string, endDate?: string) {
  await connectDB();
  
  try {
    const query: any = { status: "Completed" };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.startTime.$lte = end;
      }
    }

    const result = await Rental.aggregate([
      { $match: query },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);

    return { success: true, totalRevenue: result[0]?.totalRevenue || 0 };
  } catch (error) {
    console.error("Failed to fetch revenue:", error);
    return { error: "Could not fetch revenue." };
  }
}
