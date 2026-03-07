"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Bike, 
  AlertTriangle, 
  Settings, 
  ShieldCheck, 
  FileWarning,
  Wrench
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  plateNumber: string;
  type: string;
  status: string;
  lastKmReading: number;
  lastServiceKm: number;
  insuranceExpiry: string;
  pucExpiry: string;
  baseRatePerDay: number;
}

export function VehicleTable({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredVehicles = initialVehicles.filter((v) => {
    const matchesSearch = 
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const checkAlerts = (v: Vehicle) => {
    const alerts = [];
    const kmSinceService = v.lastKmReading - v.lastServiceKm;
    if (kmSinceService >= 3000) {
      alerts.push({ type: "service", label: `Service Due (${kmSinceService}km)` });
    }

    const today = new Date();
    const fifteenDaysFromNow = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
    
    if (v.insuranceExpiry && new Date(v.insuranceExpiry) < fifteenDaysFromNow) {
      alerts.push({ type: "doc", label: "Insurance Expiry" });
    }
    
    if (v.pucExpiry && new Date(v.pucExpiry) < fifteenDaysFromNow) {
      alerts.push({ type: "doc", label: "PUC Expiry" });
    }

    return alerts;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by model or plate number (e.g. UP65...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On-Trip">On-Trip</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Vehicle Identity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Readings</TableHead>
              <TableHead>Safety Alerts</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No vehicles found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((v) => {
                const alerts = checkAlerts(v);
                return (
                  <TableRow key={v._id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{v.model}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
                          {v.plateNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-[11px] gap-1">
                        <Bike size={10} /> {v.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={v.status === "Available" ? "success" : v.status === "On-Trip" ? "destructive" : "warning"}
                          className="text-[10px] uppercase font-bold py-0 h-4"
                        >
                          {v.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[11px]">
                        <span className="text-muted-foreground">Current: <strong>{v.lastKmReading} km</strong></span>
                        <span className="text-muted-foreground/60">Last Service: {v.lastServiceKm} km</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {alerts.length === 0 ? (
                          <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 dark:bg-green-900/10 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900/30">
                            <ShieldCheck size={10} /> Healthy
                          </div>
                        ) : (
                          alerts.map((alert, idx) => (
                            <div 
                              key={idx} 
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                alert.type === "service" 
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50" 
                                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
                              )}
                            >
                              {alert.type === "service" ? <Wrench size={10} /> : <FileWarning size={10} />}
                              {alert.label}
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link 
                        href={`/dashboard/inventory/${v._id}`} 
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "h-8 w-8")}
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
