import connectDB from "@/lib/db";
import Vehicle from "@/models/Vehicle";
import Rental from "@/models/Rental";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, CheckCircle2, AlertTriangle, IndianRupee, MapPin, Warehouse, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DbErrorCard } from "@/components/db-error-card";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function getStats() {
  await connectDB();
  
  const totalVehicles = await Vehicle.countDocuments();
  const bikesOut = await Vehicle.countDocuments({ status: "On-Trip" });
  const availableNow = await Vehicle.countDocuments({ status: "Available" });
  const maintenance = await Vehicle.countDocuments({ status: "Maintenance" });
  
  // Today's earnings (Paid rentals completed today or started today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const rentals = await Rental.find({
    createdAt: { $gte: today },
    paymentStatus: "Paid"
  });
  
  const todayEarnings = rentals.reduce((acc, rental) => acc + (rental.totalAmount || 0), 0);
  
  const vehicles = await Vehicle.find().sort({ status: 1, plateNumber: 1 });
  
  return {
    totalVehicles,
    bikesOut,
    availableNow,
    maintenance,
    todayEarnings,
    vehicles
  };
}

export default async function DashboardPage() {
  try {
    const session = await auth();
    const isOwner = (session?.user as any)?.role === "Owner";
    const { totalVehicles, bikesOut, availableNow, maintenance, todayEarnings, vehicles } = await getStats();

    const statusLabels = {
      "On-Trip": "RENTED",
      "Available": "AVAILABLE",
      "Maintenance": "SERVICE"
    };

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
              <p className="text-xs text-muted-foreground">Currently on road</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Now</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableNow}</div>
              <p className="text-xs text-muted-foreground">Ready for rental</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenance}</div>
              <p className="text-xs text-muted-foreground">Service required</p>
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
                <p className="text-xs text-muted-foreground">Revenue collected today</p>
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
                <p className="text-xs text-muted-foreground">Bikes in inventory</p>
              </CardContent>
            </Card>
          )}
        </div>

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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {vehicles.map((v) => (
                          <Link key={v._id.toString()} href={`/dashboard/inventory/${v._id}`}>
                            <Card 
                              className={cn(
                                "overflow-hidden transition-all hover:ring-2 hover:ring-primary/20 cursor-pointer h-full",
                                v.status === "On-Trip" && "border-red-200 bg-red-50/30 dark:bg-red-900/10 dark:border-red-900/30",
                                v.status === "Available" && "border-green-200 bg-green-50/30 dark:bg-green-900/10 dark:border-green-900/30",
                                v.status === "Maintenance" && "border-yellow-200 bg-yellow-50/30 dark:bg-yellow-900/10 dark:border-yellow-900/30"
                              )}
                            >
                              <div className={cn(
                                "h-1.5 w-full",
                                v.status === "On-Trip" ? "bg-red-500" : 
                                v.status === "Available" ? "bg-green-500" : "bg-yellow-500"
                              )} />
                              <CardContent className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-bold text-sm leading-none">{v.model}</h3>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-mono">
                                      {v.plateNumber}
                                    </p>
                                  </div>
                                  {v.type === "Scooter" ? (
                                    <Bike className="h-3 w-3 opacity-30 rotate-12" />
                                  ) : (
                                    <Bike className="h-3 w-3 opacity-30" />
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1.5 pt-1">
                                  <div className={cn(
                                    "h-2 w-2 rounded-full animate-pulse",
                                    v.status === "On-Trip" ? "bg-red-500" : 
                                    v.status === "Available" ? "bg-green-500" : "bg-yellow-500"
                                  )} />
                                  <span className="text-[11px] font-semibold">
                                    {statusLabels[v.status as keyof typeof statusLabels] || v.status.toUpperCase()}
                                  </span>
                                </div>
            
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-dashed">
                                  <span className="flex items-center gap-1">
                                    <MapPin size={10} />
                                    {v.lastKmReading} km
                                  </span>
                                  <span className="font-medium text-foreground">
                                    ₹{v.baseRatePerDay}/d
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
            
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard database error:", error);
    return <DbErrorCard />;
  }
}
