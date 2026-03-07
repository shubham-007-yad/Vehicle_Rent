"use client";

import { useState } from "react";
import { addVehicle } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Bike, ArrowLeft, Save, PlusCircle, Settings } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AddVehiclePage() {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await addVehicle(formData);
    
    if (result?.error) {
      toast.error(result.error);
      setIsPending(false);
    } else {
      toast.success("Vehicle added successfully!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/inventory" 
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-10 w-10")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Fleet Vehicle</h1>
          <p className="text-sm text-muted-foreground">Register a new bike or scooter to your garage</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Section */}
          <Card className="md:col-span-1 border-primary/10 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-muted">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bike className="h-4 w-4 text-primary" />
                Vehicle Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make (Brand)</Label>
                <Input name="make" id="make" placeholder="e.g. Royal Enfield, Honda" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model Name</Label>
                <Input name="model" id="model" placeholder="e.g. Hunter 350, Activa 6G" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateNumber text-primary font-bold">Plate Number (Registration)</Label>
                <Input name="plateNumber" id="plateNumber" placeholder="e.g. UP65 AB 1234" required className="uppercase font-mono font-bold" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Vehicle Category</Label>
                <Select name="type" defaultValue="Bike" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bike">Bike (Motorcycle)</SelectItem>
                    <SelectItem value="Scooter">Scooter (Gearless)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Operational Metrics */}
          <Card className="md:col-span-1 border-primary/10 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-muted">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-500" />
                Operations & Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseRatePerDay">Daily Rental Rate (₹)</Label>
                <Input name="baseRatePerDay" id="baseRatePerDay" type="number" placeholder="800" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastKmReading">Initial KM Reading</Label>
                <Input name="lastKmReading" id="lastKmReading" type="number" placeholder="1250" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastServiceKm">Last Service KM Reading</Label>
                <Input name="lastServiceKm" id="lastServiceKm" type="number" placeholder="0" />
              </div>
            </CardContent>
          </Card>

          {/* Documentation Section */}
          <Card className="md:col-span-2 border-primary/10 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-muted">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-green-500" />
                Compliance Documents (Expiries)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="insuranceExpiry">Insurance Expiry Date</Label>
                <Input name="insuranceExpiry" id="insuranceExpiry" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pucExpiry">PUC (Pollution) Expiry Date</Label>
                <Input name="pucExpiry" id="pucExpiry" type="date" required />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Link href="/dashboard/inventory" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
          <Button type="submit" className="gap-2" disabled={isPending}>
            <Save className="h-4 w-4" /> 
            {isPending ? "Adding Vehicle..." : "Save to Fleet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
