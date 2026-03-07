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
  History
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

interface InsightsProps {
  searchParams: Promise<{ date?: string }>;
}

async function getDailyInsights(dateString: string) {
  await connectDB();
  
  const targetDate = new Date(dateString);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  // Security/Logic Check: If user tries to access future, redirect to today
  if (startOfDay > now && dateString !== todayStr) {
    return null; // Signal for redirect
  }

  const isToday = dateString === todayStr;
  
  // 1. Check-ins (Bikes going OUT)
  const rentalsStarted = await Rental.find({
    startTime: { $gte: startOfDay, $lte: endOfDay }
  }).populate("vehicleId");
  
  // 2. Returns (Bikes coming IN)
  const rentalsEnded = await Rental.find({
    actualEndTime: { $gte: startOfDay, $lte: endOfDay }
  }).populate("vehicleId");
  
  const bikesOutCount = rentalsStarted.length;
  const bikesInCount = rentalsEnded.length;
  
  // 3. Revenue: Sum of totalAmount for all rentals that ENDED/were PAID on this day
  const dailyRevenue = rentalsEnded.reduce((acc, r) => acc + (r.totalAmount || 0), 0) + 
                       rentalsStarted.reduce((acc, r) => acc + (r.paymentStatus === "Paid" ? r.totalAmount : 0), 0);

  // Combine for ledger (unique list)
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
    ledger: allDayRentals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  };
}

export default async function DailyInsightsPage({ searchParams }: InsightsProps) {
  const params = await searchParams;
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = params.date || today;
  
  const data = await getDailyInsights(selectedDate);

  // Redirect if future date was attempted
  if (!data) {
    redirect("/dashboard/insights");
  }

  const { bikesOutCount, bikesInCount, dailyRevenue, ledger, isToday } = data;

  return (
    <div className="space-y-8">
      {/* Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Calendar className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">
              {isToday ? "Today's Live Ledger" : "Past Records"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 text-balance">
              {isToday ? "Live view of check-ins and revenue" : `Viewing activity for ${selectedDate}`}
            </p>
          </div>
        </div>
        
        <form className="flex items-center gap-2">
          <input 
            type="date" 
            name="date"
            defaultValue={selectedDate}
            max={today} // RESTRICTS picking future dates in the browser
            className="flex h-9 w-full md:w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button 
            type="submit"
            className={cn(buttonVariants({ size: "sm" }), "px-4")}
          >
            View Records
          </button>
        </form>
      </div>

      {/* Daily Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bikes Out</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bikesOutCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total check-ins for this day</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bikes In</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bikesInCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total returns recorded</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recorded Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{dailyRevenue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Cash/UPI flow for this date</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Ledger List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Day's Ledger (Detailed View)
        </h3>
        
        {ledger.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-xl border-2 border-dashed border-muted">
            <Clock className="mx-auto text-muted-foreground mb-2 opacity-20" size={48} />
            <p className="text-muted-foreground font-medium">No activity recorded for this date.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {ledger.map((rental) => (
              <Card key={rental._id.toString()} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row items-center">
                  <div className={cn(
                    "w-full md:w-2 px-6 py-2 md:py-0 md:h-24",
                    rental.status === "Active" ? "bg-blue-500" : "bg-green-500"
                  )} />
                  <CardContent className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Vehicle & Customer Info */}
                    <div className="flex items-start gap-4">
                      <div className="bg-muted p-3 rounded-full">
                        <Bike className="h-6 w-6 text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg leading-tight">{(rental.vehicleId as any)?.model || "Unknown Vehicle"}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User size={14} />
                          <span className="font-medium text-foreground">{rental.customerName}</span>
                          <span className="opacity-50">•</span>
                          <span className="font-mono uppercase tracking-tighter">{(rental.vehicleId as any)?.plateNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Money */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</p>
                        <div className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-block",
                          rental.status === "Active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        )}>
                          {rental.status === "Active" ? "CHECKED OUT" : "RETURNED"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Revenue</p>
                        <p className="font-bold text-lg">₹{rental.totalAmount.toLocaleString('en-IN')}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Payment</p>
                        <p className={cn(
                          "text-xs font-semibold",
                          rental.paymentStatus === "Paid" ? "text-green-600" : "text-yellow-600"
                        )}>
                          {rental.paymentStatus}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
