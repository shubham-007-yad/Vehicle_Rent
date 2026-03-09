import connectDB from "@/lib/db";
import Vehicle from "@/models/Vehicle";
import { VehicleTable } from "@/components/inventory/vehicle-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Settings, 
  Warehouse, 
  FileWarning, 
  PlusCircle, 
  Wrench
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getInventory() {
  await connectDB();
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  
  // Calculate Fleet Health Snapshot
  const totalKm = vehicles.reduce((acc, v) => acc + v.lastKmReading, 0);
  const serviceRequiredCount = vehicles.filter(v => (v.lastKmReading - v.lastServiceKm) >= 3000).length;
  
  const today = new Date();
  const fifteenDaysFromNow = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
  const docExpiryCount = vehicles.filter(v => 
    (v.insuranceExpiry && new Date(v.insuranceExpiry) < fifteenDaysFromNow) || 
    (v.pucExpiry && new Date(v.pucExpiry) < fifteenDaysFromNow)
  ).length;

  return { 
    vehicles: JSON.parse(JSON.stringify(vehicles)), 
    totalKm, 
    serviceRequiredCount, 
    docExpiryCount 
  };
}

export default async function InventoryPage() {
  const { vehicles, totalKm, serviceRequiredCount, docExpiryCount } = await getInventory();

  return (
    <div className="space-y-8">
      {/* Smart Fleet Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet Size</CardTitle>
            <Warehouse className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">Vehicles in garage</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet Mileage</CardTitle>
            <Settings className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKm.toLocaleString()} km</div>
            <p className="text-xs text-muted-foreground">Combined distance</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-4",
          serviceRequiredCount > 0 ? "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10" : "border-l-green-500"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Service Required</CardTitle>
            <Wrench className={cn("h-4 w-4", serviceRequiredCount > 0 ? "text-yellow-500" : "text-green-500")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceRequiredCount}</div>
            <p className="text-xs text-muted-foreground">KM limit exceeded</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-4",
          docExpiryCount > 0 ? "border-l-red-500 bg-red-50/50 dark:bg-red-900/10" : "border-l-green-500"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Doc Expiry Alerts</CardTitle>
            <FileWarning className={cn("h-4 w-4", docExpiryCount > 0 ? "text-red-500" : "text-green-500")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{docExpiryCount}</div>
            <p className="text-xs text-muted-foreground">Insurance/PUC (15d)</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Control Center: Inventory
          </h2>
          <Link 
            href="/dashboard/inventory/add" 
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            <PlusCircle className="h-4 w-4" /> Add Vehicle
          </Link>
        </div>

        <VehicleTable initialVehicles={vehicles} />
      </div>
    </div>
  );
}
