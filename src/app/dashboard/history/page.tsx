import { getRentalHistory } from "@/lib/actions";
import { RentalHistoryTable } from "@/components/rentals/rental-history-table";
import { 
  Archive,
  TrendingUp,
  CreditCard,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";

export default async function HistoryPage() {
  const session = await auth();
  const isOwner = (session?.user as any)?.role === "Owner";
  const { rentals, error } = await getRentalHistory();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="bg-destructive/10 p-4 rounded-full">
          <Archive className="text-destructive h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Error Loading History</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate some stats
  const totalRentals = rentals?.length || 0;
  const totalRevenue = rentals?.reduce((sum: number, r: any) => sum + r.totalAmount, 0) || 0;
  
  // Calculate Repeat Customers
  const customerTripCounts: Record<string, number> = {};
  rentals?.forEach((r: any) => {
    customerTripCounts[r.customerPhone] = (customerTripCounts[r.customerPhone] || 0) + 1;
  });
  
  const repeatCustomerCount = Object.values(customerTripCounts).filter(count => count > 1).length;
  const uniqueCustomers = Object.keys(customerTripCounts).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold italic">Rental History Archive</h1>
          <p className="text-muted-foreground">Detailed logs of all past rentals and transactions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium italic">Total Trips</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRentals}</div>
            <p className="text-xs text-muted-foreground font-semibold">Completed Rentals</p>
          </CardContent>
        </Card>
        
        {isOwner && (
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium italic">All-Time Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary italic">₹{totalRevenue.toLocaleString("en-IN")}</div>
              <p className="text-xs text-muted-foreground font-semibold">Net Collections</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-l-4 border-l-orange-500 bg-orange-500/5 dark:bg-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-orange-600">Returning Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-orange-700">
              {repeatCustomerCount}
            </div>
            <p className="text-[10px] text-orange-600/70 font-bold uppercase tracking-tight">Active Loyal Customers</p>
          </CardContent>
        </Card>
      </div>

      <RentalHistoryTable initialRentals={rentals || []} />
    </div>
  );
}
