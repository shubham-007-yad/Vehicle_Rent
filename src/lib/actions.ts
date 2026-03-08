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

import ShopSettings from "@/models/ShopSettings";

import User from "@/models/User";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function getUsers() {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const requesterEmail = session.user.email;
    const requester = await User.findOne({ email: requesterEmail });

    if (requester?.role !== "Owner") return { error: "Unauthorized" };

    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
    return { success: true, users: JSON.parse(JSON.stringify(users)) };
  } catch (error: any) {
    console.error("getUsers error:", error);
    return { error: "Could not fetch users." };
  }
}

export async function createStaffUser(data: any) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const requesterEmail = session.user.email;
    const requester = await User.findOne({ email: requesterEmail });

    if (requester?.role !== "Owner") return { error: "Unauthorized" };

    const { name, email, password, role } = data;
    const userExists = await User.findOne({ email });
    if (userExists) return { error: "User already exists." };

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "Staff",
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("createStaffUser error:", error);
    return { error: error.message || "Could not create user." };
  }
}

export async function deleteUser(id: string) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const requesterEmail = session.user.email;
    const requester = await User.findOne({ email: requesterEmail });

    if (requester?.role !== "Owner") return { error: "Unauthorized" };

    const userToDelete = await User.findById(id);
    if (!userToDelete) return { error: "User not found." };
    if (userToDelete.role === "Owner") return { error: "Cannot delete the Owner account." };

    await User.findByIdAndDelete(id);
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("deleteUser error:", error);
    return { error: "Could not delete user." };
  }
}

export async function updateUserProfile(data: { 
  name: string; 
  email: string;
  phone?: string;
  bio?: string;
  profilePictureUrl?: string;
  profileBannerUrl?: string;
}) {
  await connectDB();
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const { name, email, phone, bio, profilePictureUrl, profileBannerUrl } = data;
    
    // 1. Identify User (ID or Email)
    const userId = (session.user as any).id;
    const userEmail = session.user.email;

    let user = null;
    if (userId) user = await User.findById(userId);
    if (!user && userEmail) user = await User.findOne({ email: userEmail });

    if (!user) return { error: "User account not found." };

    // 2. Check if new email is taken (if changed)
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return { error: "This email is already linked to another account." };
    }

    // 3. Perform Update
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.bio = bio;
    user.profilePictureUrl = profilePictureUrl;
    user.profileBannerUrl = profileBannerUrl;

    await user.save();

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard"); 
    return { success: true };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { error: `Failed to update profile: ${error.message}` };
  }
}

export async function changePassword(data: any) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const { currentPassword, newPassword } = data;
    const user = await User.findOne({ email: session.user.email });

    if (!user) return { error: "User not found." };

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return { error: "Current password is incorrect." };

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { success: true };
  } catch (error: any) {
    console.error("Change password error:", error);
    return { error: "Failed to update password." };
  }
}

export async function getShopSettings() {
  await connectDB();
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = await ShopSettings.create({
        shopName: "Varanasi Rentals",
        ownerPhone: "9876543210",
        address: "Assi Ghat, Varanasi",
        defaultDepositScooter: 1000,
        defaultDepositBike: 2000,
        defaultDepositCar: 5000,
        lateFeePerHour: 100,
        damageCatalog: [
          { name: "Broken Mirror", price: 300 },
          { name: "Flat Tyre", price: 200 },
          { name: "Helmet Loss", price: 800 },
        ],
      });
    }
    return { success: true, settings: JSON.parse(JSON.stringify(settings)) };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return { error: "Could not fetch settings." };
  }
}

export async function updateShopSettings(data: any) {
  await connectDB();
  try {
    const settings = await ShopSettings.findOneAndUpdate({}, data, {
      new: true,
      upsert: true,
    });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/check-in");
    revalidatePath("/dashboard/active-trips");
    return { success: true, settings: JSON.parse(JSON.stringify(settings)) };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { error: "Could not update settings." };
  }
}

export async function handleSignOut() {
  await signOut({ redirectTo: "/login" });
}

export async function uploadImage(base64Image: string) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.error("Cloudinary config missing!");
      return { error: "Cloudinary is not configured correctly." };
    }

    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "varanasi_rentals_kyc",
    });
    return { url: uploadResponse.secure_url };
  } catch (error: any) {
    console.error("Cloudinary Upload Error Details:", error);
    return { error: `Upload failed: ${error.message || "Unknown error"}` };
  }
}

export async function uploadFile(file: File, folder: string) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.error("Cloudinary config missing!");
      return { error: "Cloudinary is not configured correctly.", url: "" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return new Promise<{ url: string; error?: string }>((resolve) => {
      cloudinary.uploader.upload_stream(
        { folder: folder, resource_type: "auto" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Stream Error:", error);
            resolve({ error: `Upload failed: ${error.message || "Unknown error"}`, url: "" });
          } else {
            resolve({ url: result?.secure_url || "" });
          }
        }
      ).end(buffer);
    });
  } catch (error: any) {
    console.error("File processing error:", error);
    return { error: `Failed to process file: ${error.message || "Unknown error"}`, url: "" };
  }
}

export async function createRental(data: any) {
  await connectDB();
  
  try {
    // Ensure nested/date objects are clean
    const rawPhotos = Array.isArray(data.idPhotoUrl) ? data.idPhotoUrl : [data.idPhotoUrl];
    
    // STRICT GUARD: Block any non-https URLs (prevents blob leaks)
    const validPhotos = rawPhotos.filter((url: string) => url.startsWith("https://"));
    
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
