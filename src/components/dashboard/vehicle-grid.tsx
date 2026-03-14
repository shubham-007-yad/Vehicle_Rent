"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bike, MapPin, Search, Filter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Vehicle {
  _id: string;
  model: string;
  plateNumber: string;
  status: string;
  type: string;
  lastKmReading: number;
  baseRatePerDay: number;
}

interface VehicleGridProps {
  vehicles: Vehicle[];
}

const statusLabels: Record<string, string> = {
  "On-Trip": "RENTED",
  "Available": "AVAILABLE",
  "Maintenance": "SERVICE"
};

export function VehicleGrid({ vehicles }: VehicleGridProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch = 
        v.model.toLowerCase().includes(search.toLowerCase()) || 
        v.plateNumber.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-muted/30 p-3 rounded-xl border border-dashed">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bike or plate..."
            className="pl-9 bg-background h-9 border-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground ml-2 hidden sm:block" />
          <Select 
            value={statusFilter} 
            onValueChange={(value) => {
              if (value) setStatusFilter(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-9 bg-background border-none shadow-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On-Trip">On-Trip</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="ml-auto hidden md:block">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Displaying {filteredVehicles.length} of {vehicles.length}
          </p>
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="py-20 text-center bg-card rounded-xl border-2 border-dashed border-muted">
          <Bike className="mx-auto text-muted-foreground mb-2 opacity-20" size={64} />
          <p className="text-muted-foreground font-medium">No bikes found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredVehicles.map((v) => (
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
                    <Bike className={cn("h-3 w-3 opacity-30", v.type === "Scooter" && "rotate-12")} />
                  </div>
                  
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className={cn(
                      "h-2 w-2 rounded-full animate-pulse",
                      v.status === "On-Trip" ? "bg-red-500" : 
                      v.status === "Available" ? "bg-green-500" : "bg-yellow-500"
                    )} />
                    <span className="text-[11px] font-semibold">
                      {statusLabels[v.status] || v.status.toUpperCase()}
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
  );
}
