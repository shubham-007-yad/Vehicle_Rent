import connectDB from "@/lib/db";
import Rental from "@/models/Rental";
import Vehicle from "@/models/Vehicle";
import { ActiveTripsList } from "@/components/rentals/active-trips-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, Clock, AlertCircle } from "lucide-react";
import { getShopSettings } from "@/lib/actions";

export const dynamic = "force-dynamic";

async function getActiveTrips() {
  await connectDB();
  
  // 1. Get all vehicles marked as 'On-Trip' in the inventory
  const vehiclesOnTrip = await Vehicle.find({ status: "On-Trip" });
  
  // 2. Get all active rentals
  const rentals = await Rental.find({ status: "Active" }).populate("vehicleId");
  
  // 3. Combine them to ensure even manual toggles are visible
  const activeTripsData = vehiclesOnTrip.map(vehicle => {
    // Check if there's an actual rental record for this vehicle
    const rental = rentals.find(r => r.vehicleId && (r.vehicleId as any)._id.toString() === vehicle._id.toString());
    
    if (rental) {
      return JSON.parse(JSON.stringify(rental));
    }
    
    // If no rental record exists (Manual Toggle in Inventory), create a placeholder
    return {
      _id: `manual-${vehicle._id}`,
      customerName: "Manual Status Toggle",
      customerPhone: "N/A",
      startTime: vehicle.updatedAt,
      expectedEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
      startKm: vehicle.lastKmReading,
      depositAmount: 0,
      status: "Active",
      totalAmount: vehicle.baseRatePerDay,
      vehicleId: JSON.parse(JSON.stringify(vehicle)),
      isManual: true
    };
  });

  const now = new Date();
  const overdueCount = activeTripsData.filter(r => new Date(r.expectedEndTime) < now && !r.isManual).length;
  const dueTodayCount = activeTripsData.filter(r => {
    const end = new Date(r.expectedEndTime);
    return end.toDateString() === now.toDateString() && end > now;
  }).length;

  return {
    rentals: activeTripsData,
    overdueCount,
    dueTodayCount
  };
}

export default async function ActiveTripsPage() {
  const { rentals, overdueCount, dueTodayCount } = await getActiveTrips();
  const { settings } = await getShopSettings();

  return (
    <div className="space-y-8">
      {/* Real-time Trip Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bikes on Road</CardTitle>
            <Bike className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentals.length}</div>
            <p className="text-xs text-muted-foreground">Active rental agreements</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due Back Today</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueTodayCount}</div>
            <p className="text-xs text-muted-foreground">Expected returns before midnight</p>
          </CardContent>
        </Card>

        <Card className={overdueCount > 0 ? "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20" : "border-l-4 border-l-green-500"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Trips</CardTitle>
            <AlertCircle className={overdueCount > 0 ? "h-4 w-4 text-red-500 animate-pulse" : "h-4 w-4 text-green-500"} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Action required: Contact customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Live Trip Tracking
          </h2>
        </div>

        <ActiveTripsList initialRentals={rentals} settings={settings} />
      </div>
    </div>
  );
}
