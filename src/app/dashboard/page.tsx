import connectDB from "@/lib/db";
import Vehicle from "@/models/Vehicle";
import Rental from "@/models/Rental";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, CheckCircle2, AlertTriangle, IndianRupee, Warehouse, TrendingUp, TrendingDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DbErrorCard } from "@/components/db-error-card";
import { auth } from "@/auth";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { FleetHealth } from "@/components/dashboard/fleet-health";
import { VehicleGrid } from "@/components/dashboard/vehicle-grid";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

async function getStats() {
  await connectDB();
  
  const totalVehicles = await Vehicle.countDocuments();
  const bikesOut = await Vehicle.countDocuments({ status: "On-Trip" });
  const availableNow = await Vehicle.countDocuments({ status: "Available" });
  const maintenance = await Vehicle.countDocuments({ status: "Maintenance" });
  
  // Today's earnings
  const today = startOfDay(new Date());
  const tomorrow = endOfDay(new Date());
  
  const todayRentals = await Rental.find({
    createdAt: { $gte: today, $lte: tomorrow },
    paymentStatus: "Paid"
  });
  
  const todayEarnings = todayRentals.reduce((acc, rental) => acc + (rental.totalAmount || 0), 0);
  
  // Yesterday's earnings for trend
  const yesterdayStart = startOfDay(subDays(new Date(), 1));
  const yesterdayEnd = endOfDay(subDays(new Date(), 1));
  const yesterdayRentals = await Rental.find({
    createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
    paymentStatus: "Paid"
  });
  const yesterdayEarnings = yesterdayRentals.reduce((acc, rental) => acc + (rental.totalAmount || 0), 0);
  const revenueTrend = yesterdayEarnings === 0 ? 100 : ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100;

  // Revenue for last 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    const dayRentals = await Rental.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "Paid"
    });
    
    const amount = dayRentals.reduce((acc, rental) => acc + (rental.totalAmount || 0), 0);
    chartData.push({
      date: start.toISOString(),
      amount
    });
  }

  // Fleet Health Data
  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
  
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiringInsuranceCount = await Vehicle.countDocuments({
    insuranceExpiry: { $lte: fifteenDaysFromNow }
  });
  
  const expiringPucCount = await Vehicle.countDocuments({
    pucExpiry: { $lte: sevenDaysFromNow }
  });

  const allVehicles = await Vehicle.find();
  const upcomingServiceCount = allVehicles.filter(v => (v.lastKmReading - v.lastServiceKm) > 2500).length;

  const vehicles = await Vehicle.find().sort({ status: 1, plateNumber: 1 });
  
  return {
    totalVehicles,
    bikesOut,
    availableNow,
    maintenance,
    todayEarnings,
    revenueTrend,
    chartData,
    fleetHealth: {
      maintenanceCount: maintenance,
      expiringInsuranceCount,
      expiringPucCount,
      upcomingServiceCount
    },
    vehicles: vehicles.map(v => ({
      _id: v._id.toString(),
      model: v.model,
      plateNumber: v.plateNumber,
      status: v.status,
      type: v.type,
      lastKmReading: v.lastKmReading,
      baseRatePerDay: v.baseRatePerDay
    }))
  };
}

export default async function DashboardPage() {
  try {
    const session = await auth();
    const isOwner = (session?.user as any)?.role === "Owner";
    const { 
      totalVehicles, 
      bikesOut, 
      availableNow, 
      maintenance, 
      todayEarnings, 
      revenueTrend,
      chartData,
      fleetHealth,
      vehicles 
    } = await getStats();

    return (
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bikes Out</CardTitle>
              <Bike className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bikesOut}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  {totalVehicles > 0 ? ((bikesOut / totalVehicles) * 100).toFixed(0) : 0}% utilization
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Now</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableNow}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for pickup</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenance}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently in shop</p>
            </CardContent>
          </Card>

          {isOwner ? (
            <Card className="border-l-4 border-l-primary bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
                <IndianRupee className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">₹{todayEarnings.toLocaleString('en-IN')}</div>
                <div className="flex items-center gap-1 mt-1">
                  {revenueTrend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    revenueTrend >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {Math.abs(revenueTrend).toFixed(1)}% {revenueTrend >= 0 ? "increase" : "decrease"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
                <Warehouse className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVehicles}</div>
                <p className="text-xs text-muted-foreground mt-1">Active inventory</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visual Insights Section */}
        {isOwner && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <RevenueChart data={chartData} />
            <FleetHealth data={fleetHealth} />
          </div>
        )}

        {/* Live Garage Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Live Garage Status
            </h2>
            <Link 
              href="/dashboard/inventory" 
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Manage Fleet
            </Link>
          </div>

          {vehicles.length === 0 ? (
                      <div className="py-20 text-center bg-card rounded-xl border-2 border-dashed border-muted">
                        <Bike className="mx-auto text-muted-foreground mb-2 opacity-20" size={64} />
                        <p className="text-muted-foreground font-medium">No vehicles added to your fleet yet.</p>
                        <Link 
                          href="/dashboard/inventory" 
                          className={cn(buttonVariants({ size: "sm" }), "mt-4")}
                        >
                          Add First Vehicle
                        </Link>
                      </div>
            
          ) : (
                      <VehicleGrid vehicles={vehicles} />
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard database error:", error);
    return <DbErrorCard />;
  }
}
