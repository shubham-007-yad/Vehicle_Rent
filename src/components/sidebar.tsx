"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Bike, 
  Warehouse, 
  ClipboardList, 
  Settings, 
  LogOut,
  User,
  Moon,
  Sun,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { handleSignOut } from "@/lib/actions";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Daily Insights", href: "/dashboard/insights", icon: CalendarDays },
  { name: "Check-In", href: "/dashboard/check-in", icon: PlusCircle },
  { name: "Active Trips", href: "/dashboard/active-trips", icon: Bike },
  { name: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
  { name: "History", href: "/dashboard/history", icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  return (
    <div className="w-64 border-r bg-card/50 backdrop-blur-md flex flex-col h-full shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Bike size={28} />
          <span>Varanasi Rentals</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto space-y-1">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            pathname === "/dashboard/settings"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </Link>
        
        <div className="flex items-center justify-between px-3 py-2">
           <div className="flex items-center gap-3 text-muted-foreground">
             <User size={20} />
             <span className="font-medium">Owner</span>
           </div>
           <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
           >
             <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
             <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
             <span className="sr-only">Toggle theme</span>
           </Button>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={() => handleSignOut()}
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </Button>
      </div>
    </div>
  );
}
