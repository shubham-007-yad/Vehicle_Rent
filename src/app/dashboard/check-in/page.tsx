import connectDB from "@/lib/db";
import Vehicle from "@/models/Vehicle";
import { CheckInForm } from "@/components/rentals/check-in-form";

async function getAvailableVehicles() {
  await connectDB();
  const vehicles = await Vehicle.find({ status: "Available" }).sort({ model: 1 });
  return JSON.parse(JSON.stringify(vehicles));
}

export default async function CheckInPage() {
  const availableVehicles = await getAvailableVehicles();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold italic tracking-tight">60-Second Check-In</h1>
        <p className="text-sm text-muted-foreground">Start a new rental journey for your customer</p>
      </div>

      <CheckInForm availableVehicles={availableVehicles} />
    </div>
  );
}
