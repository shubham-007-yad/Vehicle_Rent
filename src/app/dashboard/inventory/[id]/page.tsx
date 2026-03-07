import connectDB from "@/lib/db";
import Vehicle from "@/models/Vehicle";
import { EditVehicleForm } from "@/components/inventory/edit-vehicle-form";
import { notFound } from "next/navigation";

interface VehiclePageProps {
  params: Promise<{ id: string }>;
}

async function getVehicle(id: string) {
  await connectDB();
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) return null;
  return JSON.parse(JSON.stringify(vehicle));
}

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  return <EditVehicleForm vehicle={vehicle} />;
}
