"use client";

import { Sidebar } from "@/components/sidebar";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState(new Date());
  const pathname = usePathname();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(time);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Live Garage Status";
    if (pathname.includes("/dashboard/insights")) return "Daily Insights (Kal ka Khata)";
    if (pathname.includes("/dashboard/check-in")) return "New Rental Check-In";
    if (pathname.includes("/dashboard/active-trips")) return "Active Trips";
    if (pathname.includes("/dashboard/inventory")) return "Fleet Inventory";
    if (pathname.includes("/dashboard/history")) return "Rental History";
    if (pathname.includes("/dashboard/settings")) return "Settings";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-foreground">{getPageTitle()}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
            <span className="bg-accent px-3 py-1.5 rounded-full border">
              {formattedTime}
            </span>
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
