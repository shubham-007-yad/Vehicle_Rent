"use client";

import { useState } from "react";
import { updateVehicle, deleteVehicle } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Bike, 
  ArrowLeft, 
  Save, 
  Wrench, 
  FileCheck, 
  AlertCircle,
  IndianRupee,
  ShieldAlert,
  CalendarDays,
  Settings,
  Trash2,
  Info
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function EditVehicleForm({ vehicle }: { vehicle: any }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState(vehicle.status);
  const [formData, setFormData] = useState({
    make: vehicle.make ?? "",
    model: vehicle.model ?? "",
    plateNumber: vehicle.plateNumber ?? "",
    baseRatePerDay: vehicle.baseRatePerDay ?? 0,
    lastKmReading: vehicle.lastKmReading ?? 0,
    lastServiceKm: vehicle.lastServiceKm ?? 0,
    insuranceExpiry: vehicle.insuranceExpiry?.split('T')[0] || "",
    pucExpiry: vehicle.pucExpiry?.split('T')[0] || ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteVehicle(vehicle._id);
    if (result?.error) {
      toast.error(result.error);
      setIsPending(false);
    } else {
      toast.success("Vehicle deleted from fleet.");
      router.push("/dashboard/inventory");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    const data = new FormData(e.currentTarget);
    data.append("status", status); 
    
    const result = await updateVehicle(vehicle._id, data);
    
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Vehicle updated successfully!");
    }
    setIsPending(false);
  };

  const kmSinceService = Number(formData.lastKmReading) - Number(formData.lastServiceKm);
  const isServiceDue = kmSinceService >= 3000;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/inventory" 
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-10 w-10")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold italic tracking-tight">{formData.model || vehicle.model}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono uppercase bg-muted px-2 py-0.5 rounded text-muted-foreground border">
                {formData.plateNumber || vehicle.plateNumber}
              </span>
              <Badge variant={status === "Available" ? "success" : status === "On-Trip" ? "destructive" : "warning"} className="text-[10px] uppercase font-bold py-0 h-4">
                {status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <Link 
              href="/dashboard/active-trips" 
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 h-9")}
            >
              <History size={14} /> View History
            </Link>
            <Button 
              type="submit" 
              form="vehicle-edit-form" 
              className="gap-2 h-9" 
              disabled={isPending}
            >
              <Save size={14} /> {isPending ? "Saving..." : "Update Fleet Data"}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration Form */}
        <div className="lg:col-span-2">
          <form id="vehicle-edit-form" onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-primary/10 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <Info className="h-4 w-4" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Make (Brand)</Label>
                  <Input 
                    name="make" 
                    value={formData.make} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Royal Enfield" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Model Name</Label>
                  <Input 
                    name="model" 
                    value={formData.model} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Hunter 350" 
                    required 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Plate Number (Registration)</Label>
                  <Input 
                    name="plateNumber" 
                    value={formData.plateNumber} 
                    onChange={handleInputChange} 
                    placeholder="e.g. UP65 AB 1234" 
                    required 
                    className="uppercase font-mono font-bold"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  Operational Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Current Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className={cn(
                        "h-10 font-bold",
                        status === "Available" ? "border-green-200 bg-green-50/10 text-green-700" :
                        status === "On-Trip" ? "border-red-200 bg-red-50/10 text-red-700" : "border-yellow-200 bg-yellow-50/10 text-yellow-700"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available (Ready for Rent)</SelectItem>
                      <SelectItem value="On-Trip">On-Trip (Locked)</SelectItem>
                      <SelectItem value="Maintenance">In Maintenance (Hidden)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Pricing Control (₹/Day)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      name="baseRatePerDay" 
                      type="number" 
                      value={formData.baseRatePerDay} 
                      onChange={handleInputChange} 
                      className="pl-9 font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Total KM Reading</Label>
                  <Input 
                    name="lastKmReading" 
                    type="number" 
                    value={formData.lastKmReading} 
                    onChange={handleInputChange} 
                    className="font-mono" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Last Service Reading</Label>
                  <Input 
                    name="lastServiceKm" 
                    type="number" 
                    value={formData.lastServiceKm} 
                    onChange={handleInputChange} 
                    className="font-mono" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <FileCheck className="h-4 w-4" />
                  Document Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Insurance Expiry</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      name="insuranceExpiry" 
                      type="date" 
                      value={formData.insuranceExpiry} 
                      onChange={handleInputChange} 
                      className="pl-9" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">PUC (Pollution) Expiry</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      name="pucExpiry" 
                      type="date" 
                      value={formData.pucExpiry} 
                      onChange={handleInputChange} 
                      className="pl-9" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Side Panel: Health & Insights */}
        <div className="space-y-6">
          <Card className={cn(
            "border-l-4",
            isServiceDue ? "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10" : "border-l-green-500"
          )}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-3 w-3" /> Service Health
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black">{kmSinceService} km</div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">Driven since last oil change</p>
                {isServiceDue && (
                    <div className="mt-3 flex items-center gap-2 text-yellow-700 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded border border-yellow-200 dark:border-yellow-900">
                        <AlertCircle size={14} className="shrink-0" />
                        <span className="text-[10px] font-bold uppercase">Schedule maintenance immediately</span>
                    </div>
                )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <IndianRupee className="h-3 w-3" /> Lifetime Revenue
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black">₹{((Number(formData.lastKmReading) / 50) * Number(formData.baseRatePerDay)).toLocaleString()}*</div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">Projected based on usage</p>
                <div className="mt-4 p-2 bg-muted/50 rounded border text-[10px] text-muted-foreground italic">
                   *Exact revenue tracking will be linked to Rental Records.
                </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500 text-white shadow-lg shadow-red-500/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 opacity-90">
                    <ShieldAlert className="h-3 w-3" /> Quick Access
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 text-xs font-bold h-8 border border-white/20">
                    View Digital RC (Reg. Cert)
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 text-xs font-bold h-8 border border-white/20">
                    Download Insurance Policy
                </Button>
            </CardContent>
          </Card>

          {/* Danger Zone: DELETE Vehicle */}
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10 shadow-sm border-dashed">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                    <Trash2 className="h-3 w-3" /> Danger Zone
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-[10px] text-red-500/80 mb-4 font-medium uppercase italic">
                    Once deleted, all logs for this vehicle will be archived permanently.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger 
                    render={
                      <Button variant="destructive" className="w-full h-9 text-xs font-bold uppercase">
                        Remove From Fleet
                      </Button>
                    } 
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the <strong>{formData.model}</strong> ({formData.plateNumber}) 
                        from your garage inventory. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Delete Vehicle
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function History({ size }: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
}
