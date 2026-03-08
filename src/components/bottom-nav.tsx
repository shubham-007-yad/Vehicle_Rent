"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Bike, 
  Warehouse, 
  ClipboardList 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Check-In", href: "/dashboard/check-in", icon: PlusCircle },
  { name: "Active", href: "/dashboard/active-trips", icon: Bike },
  { name: "Fleet", href: "/dashboard/inventory", icon: Warehouse },
  { name: "History", href: "/dashboard/history", icon: ClipboardList },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t px-2 pb-safe-area-inset-bottom">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon size={20} className={cn(isActive && "fill-primary/20")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {item.name}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
