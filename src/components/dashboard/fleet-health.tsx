"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FleetHealthProps {
  data: {
    maintenanceCount: number;
    expiringInsuranceCount: number;
    expiringPucCount: number;
    upcomingServiceCount: number;
  };
}

export function FleetHealth({ data }: FleetHealthProps) {
  const alerts = [
    {
      label: "In Maintenance",
      count: data.maintenanceCount,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      description: "Vehicles currently in service",
    },
    {
      label: "Insurance Expiring",
      count: data.expiringInsuranceCount,
      icon: Calendar,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      description: "Expiring within 15 days",
    },
    {
      label: "PUC Expiring",
      count: data.expiringPucCount,
      icon: AlertTriangle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "Expiring within 7 days",
    },
    {
      label: "Service Due",
      count: data.upcomingServiceCount,
      icon: AlertTriangle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "KM limit reached",
    },
  ];

  const totalAlerts = alerts.reduce((acc, alert) => acc + alert.count, 0);

  return (
    <Card className="col-span-full md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          Fleet Health
          {totalAlerts === 0 && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalAlerts === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500/20 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Everything looks good!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {alerts.filter(a => a.count > 0).map((alert) => (
              <div
                key={alert.label}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-md", alert.bgColor)}>
                    <alert.icon className={cn("h-4 w-4", alert.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">{alert.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{alert.description}</p>
                  </div>
                </div>
                <div className="text-lg font-bold">{alert.count}</div>
              </div>
            ))}
          </div>
        )}
        <Link 
          href="/dashboard/inventory" 
          className="text-xs text-primary font-medium hover:underline block pt-2 text-center"
        >
          View Full Inventory Details
        </Link>
      </CardContent>
    </Card>
  );
}
