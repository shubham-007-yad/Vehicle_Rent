"use client";

import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bike, User, Settings, LogOut, ShieldCheck, ChevronDown, Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/lib/actions";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const user = session?.user;

  useEffect(() => {
    setMounted(true);
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
    if (pathname.includes("/dashboard/profile")) return "Your Profile";
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
             <h1 className="text-lg md:text-xl font-bold text-foreground truncate max-w-[120px] md:max-w-none">
                {getPageTitle()}
             </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-muted-foreground font-medium">
            <span className="bg-accent px-2 md:px-3 py-1 md:py-1.5 rounded-full border whitespace-nowrap min-w-[120px] text-center">
              {mounted ? formattedTime : "--:--"}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="sm" className="h-9 gap-1 px-1.5 md:px-3 rounded-full border bg-background/50 overflow-hidden">
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border">
                    {user?.image ? (
                      <img src={user.image} alt="DP" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-primary" />
                    )}
                  </div>
                  <ChevronDown size={12} className="opacity-50 hidden md:block" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col gap-1 px-3 py-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Account</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <ShieldCheck size={14} className="text-primary" />
                      {user?.name || "User"}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer gap-2 py-2 outline-none flex items-center px-3"
                  onClick={() => router.push("/dashboard/profile")}
                >
                  <User size={16} />
                  <span>Your Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-2 py-2 outline-none flex items-center px-3"
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <Settings size={16} />
                  <span>Shop Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer gap-2 py-2 outline-none flex items-center px-3"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <div className="relative flex items-center justify-center w-4 h-4 mr-1">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                  <span>{mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Theme"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleSignOut()} 
                  className="cursor-pointer gap-2 py-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
