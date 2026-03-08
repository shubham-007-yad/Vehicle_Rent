"use client";

import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bike } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState(new Date());
  const pathname = usePathname();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(time);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Live Garage";
    if (pathname.includes("/dashboard/insights")) return "Daily Insights";
    if (pathname.includes("/dashboard/check-in")) return "New Rental";
    if (pathname.includes("/dashboard/active-trips")) return "Active Trips";
    if (pathname.includes("/dashboard/inventory")) return "Fleet Inventory";
    if (pathname.includes("/dashboard/history")) return "Rental History";
    if (pathname.includes("/dashboard/settings")) return "Settings";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar hidden on mobile, visible on medium screens and up */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header - Optimized for mobile */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
             {/* Logo only shows on mobile header */}
             <div className="md:hidden text-primary">
                <Bike size={24} strokeWidth={3} />
             </div>
             <h1 className="text-lg md:text-xl font-bold text-foreground truncate max-w-[180px] md:max-w-none">
                {getPageTitle()}
             </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-muted-foreground font-medium">
            <span className="bg-accent px-2 md:px-3 py-1 md:py-1.5 rounded-full border whitespace-nowrap">
              {formattedTime}
            </span>
          </div>
        </header>

        {/* Content Section - Adjusted padding for BottomNav on mobile */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 pb-24 md:pb-6 scroll-smooth">
          {children}
        </main>

        {/* Mobile-only Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
