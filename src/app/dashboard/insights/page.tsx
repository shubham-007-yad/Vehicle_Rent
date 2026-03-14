import connectDB from "@/lib/db";
import Rental from "@/models/Rental";
import Vehicle from "@/models/Vehicle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  IndianRupee, 
  Calendar, 
  Bike,
  User,
  Clock,
  History,
  Trophy,
  TrendingUp
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export const dynamic = "force-dynamic";

interface InsightsProps {
  searchParams: Promise<{ date?: string }>;
}

async function getDailyInsights(dateString: string) {
  await connectDB();
  
  const targetDate = new Date(dateString);
  const startOfSelectedDay = startOfDay(targetDate);
  const endOfSelectedDay = endOfDay(targetDate);
  
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  
  // Security/Logic Check: If user tries to access future, redirect to today
  if (startOfSelectedDay > now && dateString !== todayStr) {
    return null; // Signal for redirect
  }

  const isToday = dateString === todayStr;
  
  // 1. Daily Stats
  const rentalsStarted = await Rental.find({
    startTime: { $gte: startOfSelectedDay, $lte: endOfSelectedDay }
  }).populate("vehicleId");
  
  const rentalsEnded = await Rental.find({
    actualEndTime: { $gte: startOfSelectedDay, $lte: endOfSelectedDay }
  }).populate("vehicleId");
  
  const bikesOutCount = rentalsStarted.length;
  const bikesInCount = rentalsEnded.length;
  
  const dailyRevenue = rentalsEnded.reduce((acc, r) => acc + (r.totalAmount || 0), 0) + 
                       rentalsStarted.reduce((acc, r) => acc + (r.paymentStatus === "Paid" ? r.totalAmount : 0), 0);

  // 2. Weekly Volume Data for Chart
  const volumeData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    const dayStarts = await Rental.countDocuments({
      startTime: { $gte: start, $lte: end }
    });
    const dayEnds = await Rental.countDocuments({
      actualEndTime: { $gte: start, $lte: end }
    });
    
    volumeData.push({
      date: start.toISOString(),
      checkIns: dayStarts,
      returns: dayEnds
    });
  }

  // 3. Top Performing Vehicles (Last 30 Days)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentRentals = await Rental.find({
    createdAt: { $gte: thirtyDaysAgo }
  }).populate("vehicleId");

  const vehicleStats: Record<string, { model: string, plate: string, revenue: number, rentals: number }> = {};
  
  recentRentals.forEach(r => {
    const v = r.vehicleId as any;
    if (!v) return;
    const id = v._id.toString();
    if (!vehicleStats[id]) {
      vehicleStats[id] = { model: v.model, plate: v.plateNumber, revenue: 0, rentals: 0 };
    }
    vehicleStats[id].revenue += r.totalAmount || 0;
    vehicleStats[id].rentals += 1;
  });

  const topVehicles = Object.values(vehicleStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  // Combine for ledger
  const allDayRentals = [...rentalsStarted];
  rentalsEnded.forEach(r => {
    if (!allDayRentals.find(existing => existing._id.toString() === r._id.toString())) {
      allDayRentals.push(r);
    }
  });

  return {
    bikesOutCount,
    bikesInCount,
    dailyRevenue,
    isToday,
    volumeData,
    topVehicles,
    ledger: allDayRentals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  };
}

export default async function DailyInsightsPage({ searchParams }: InsightsProps) {
  const session = await auth();
  if (!session || (session.user as any).role !== "Owner") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const today = format(new Date(), 'yyyy-MM-dd');
  const selectedDate = params.date || today;
  
  const data = await getDailyInsights(selectedDate);

  if (!data) {
    redirect("/dashboard/insights");
  }

  const { bikesOutCount, bikesInCount, dailyRevenue, ledger, isToday, volumeData, topVehicles } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* Date Selector Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Calendar className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">
              {isToday ? "Live Analytics" : "Past Records"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isToday ? "Real-time rental activity" : `Activity for ${selectedDate}`}
            </p>
          </div>
        </div>
        
        <form className="flex items-center gap-2">
          <input 
            type="date" 
            name="date"
            defaultValue={selectedDate}
            max={today}
            className="flex h-9 w-full md:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button 
            type="submit"
            className={cn(buttonVariants({ size: "sm" }), "px-4")}
          >
            Go
          </button>
        </form>
      </div>

      {/* Snapshot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
              Check-ins
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bikesOutCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Bikes left garage</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
              Returns
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bikesInCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Bikes returned</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
              Total Revenue
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-bold text-primary">₹{dailyRevenue.toLocaleString('en-IN')}</div>
            <div className="bg-primary/5 p-2 rounded-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase">Daily Target: ₹5,000</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="md:col-span-4">
          <VolumeChart data={volumeData} />
        </div>
        
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Top Bikes (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topVehicles.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No rental data yet</p>
              ) : (
                topVehicles.map((v, i) => (
                  <div key={v.plate} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-bold leading-none">{v.model}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">{v.plate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">₹{v.revenue.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-muted-foreground">{v.rentals} rentals</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Operations Ledger
          </h3>
          <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium text-muted-foreground">
            {ledger.length} events
          </span>
        </div>
        
        {ledger.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-xl border-2 border-dashed border-muted">
            <Clock className="mx-auto text-muted-foreground mb-2 opacity-20" size={48} />
            <p className="text-muted-foreground font-medium">No activity recorded for this date.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {ledger.map((rental) => (
              <Card key={rental._id.toString()} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-stretch">
                  <div className={cn(
                    "w-1.5",
                    rental.status === "Active" ? "bg-blue-500" : "bg-green-500"
                  )} />
                  <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-lg">
                        <Bike className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight">{(rental.vehicleId as any)?.model}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                          {rental.customerName} • {(rental.vehicleId as any)?.plateNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">Amount</p>
                        <p className="font-bold text-sm">₹{rental.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">Type</p>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          rental.status === "Active" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        )}>
                          {rental.status === "Active" ? "Out" : "In"}
                        </div>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">Payment</p>
                        <p className={cn(
                          "text-[10px] font-bold",
                          rental.paymentStatus === "Paid" ? "text-green-600" : "text-yellow-600"
                        )}>
                          {rental.paymentStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
