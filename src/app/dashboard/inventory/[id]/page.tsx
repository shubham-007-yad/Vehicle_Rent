import connectDB from "@/lib/db";
import Vehicle from "@/models/Vehicle";
import Rental from "@/models/Rental";
import { EditVehicleForm } from "@/components/inventory/edit-vehicle-form";
import { notFound } from "next/navigation";

interface VehiclePageProps {
  params: Promise<{ id: string }>;
}

async function getVehicleData(id: string) {
  await connectDB();
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) return null;

  // Calculate actual revenue from completed rentals
  const rentals = await Rental.find({ 
    vehicleId: id, 
    status: "Completed" 
  });
  
  const totalRevenue = rentals.reduce((sum, rental) => sum + (rental.totalAmount || 0), 0);

  return {
    vehicle: JSON.parse(JSON.stringify(vehicle)),
    totalRevenue
  };
}

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const { id } = await params;
  const data = await getVehicleData(id);

  if (!data) {
    notFound();
  }

  return <EditVehicleForm vehicle={data.vehicle} actualRevenue={data.totalRevenue} />;
}
