"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  MessageCircle, 
  Clock, 
  MapPin, 
  User, 
  IndianRupee,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  Bike,
  Download,
  Printer,
  Maximize2,
  Loader2,
  Camera
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completeRental } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VehicleInspection } from "./vehicle-inspection";

interface ActiveTripsListProps {
  initialRentals: any[];
  settings: any;
}

export function ActiveTripsList({ initialRentals, settings }: ActiveTripsListProps) {
  const router = useRouter();
  const [rentals, setRentals] = useState(initialRentals);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Form State for Return
  const [returnForm, setReturnForm] = useState({
    endKm: "",
    damageCharges: "0",
    fuelCharges: "0",
    paymentStatus: "Paid" as "Paid" | "Pending",
    rentPaidAtStart: false,
    adjustFromDeposit: false,
    endInspectionPhotos: [] as string[],
    endDamageHotspots: [] as any[]
  });

  const openDocsModal = (rental: any) => {
    setSelectedRental(rental);
    setIsDocsModalOpen(true);
  };

  const openReturnModal = (rental: any) => {
    setSelectedRental(rental);
    setReturnForm({
      endKm: String(rental.vehicleId?.lastKmReading || ""),
      damageCharges: "0",
      fuelCharges: "0",
      paymentStatus: "Paid",
      rentPaidAtStart: false,
      adjustFromDeposit: false,
      endInspectionPhotos: [],
      endDamageHotspots: []
    });
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;
    
    setIsPending(true);
    const formData = new FormData();
    formData.append("endKm", returnForm.endKm);
    formData.append("damageCharges", returnForm.damageCharges);
    formData.append("fuelCharges", returnForm.fuelCharges);
    formData.append("paymentStatus", returnForm.paymentStatus);
    formData.append("rentPaidAtStart", String(returnForm.rentPaidAtStart));
    formData.append("adjustFromDeposit", String(returnForm.adjustFromDeposit));
    
    // Add Inspection Data
    returnForm.endInspectionPhotos.forEach((url) => {
      formData.append("endInspectionPhotos", url);
    });
    formData.append("endDamageHotspots", JSON.stringify(returnForm.endDamageHotspots));
    
    // Calculate total
    const billing = calculateFinalBill(selectedRental, returnForm);
    formData.append("totalAmount", String(billing.netBill));
    formData.append("lateFees", String(calculateLateFees(selectedRental).lateFees));

    const result = await completeRental(selectedRental._id, formData);
    
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Return recorded. Redirecting to payment...");
      setIsReturnModalOpen(false);
      router.push(`/dashboard/payments/${selectedRental._id}`);
    }
    setIsPending(false);
  };

  const calculateLateFees = (rental: any) => {
    const now = new Date();
    const expectedEnd = new Date(rental.expectedEndTime);
    if (now <= expectedEnd) return { lateFees: 0, hoursLate: 0 };
    
    const diffMs = now.getTime() - expectedEnd.getTime();
    const hoursLate = Math.ceil(diffMs / (1000 * 60 * 60));
    // Use late fee from settings
    const lateFeeRate = settings?.lateFeePerHour || 100;
    const lateFees = hoursLate * lateFeeRate; 
    return { lateFees, hoursLate };
  };

  const calculateFinalBill = (rental: any, form: any) => {
    const { lateFees } = calculateLateFees(rental);
    const baseAmount = rental.baseRateAtBooking || 0; 
    const damage = Number(form.damageCharges) || 0;
    const fuel = Number(form.fuelCharges) || 0;
    const deposit = rental.depositAmount || 0;
    
    // Net Bill is the total cost of the trip
    const netBill = baseAmount + lateFees + damage + fuel;
    
    // Net Bill to Collect Now
    // If rent was already paid, we only collect extras
    const collectNow = form.rentPaidAtStart 
      ? (damage + fuel)
      : netBill;

    let amountToCollect = 0;
    let refundToCustomer = 0;

    if (form.adjustFromDeposit) {
      // Adjustment case: customer pays using their deposit
      if (deposit >= collectNow) {
        refundToCustomer = deposit - collectNow;
        amountToCollect = 0;
      } else {
        amountToCollect = collectNow - deposit;
        refundToCustomer = 0;
      }
    } else {
      // Separate case: customer pays the full bill and gets the full deposit back
      amountToCollect = collectNow;
      refundToCustomer = deposit;
    }

    return { 
      baseAmount, 
      lateFees, 
      damage, 
      fuel, 
      deposit, 
      netBill,
      amountToCollect,
      refundToCustomer,
      isAdjustment: form.adjustFromDeposit
    };
  };

  const getTimeStatus = (expectedEnd: string) => {
    const now = new Date();
    const end = new Date(expectedEnd);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs < 0) {
      const hoursLate = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60));
      return { label: `Overdue by ${hoursLate}h`, color: "text-red-600 bg-red-50 dark:bg-red-950/30", isOverdue: true };
    }
    
    const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
    if (hoursLeft <= 3) return { label: `${hoursLeft}h remaining`, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30", isOverdue: false };
    return { label: `${hoursLeft}h remaining`, color: "text-green-600 bg-green-50 dark:bg-green-950/30", isOverdue: false };
  };

  const sendWhatsApp = (rental: any) => {
    const timeStatus = getTimeStatus(rental.expectedEndTime);
    const message = `Hello ${rental.customerName}, your rental ${rental.vehicleId?.model} (${rental.vehicleId?.plateNumber}) is due back at ${new Date(rental.expectedEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Please return it on time to avoid late fees. - Varanasi Rentals`;
    window.open(`https://wa.me/91${rental.customerPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const printImage = (url: string) => {
    const win = window.open("");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Print Document - Varanasi Rentals</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: white; }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @media print { img { max-width: 100%; max-height: 100%; } }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <img src="${url}" />
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[250px]">Vehicle & Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Start KM / Deposit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Clock size={40} className="mb-2 opacity-20" />
                    <p>No bikes are currently on the road.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rentals.map((rental) => {
                const timeStatus = getTimeStatus(rental.expectedEndTime);
                return (
                  <TableRow key={rental._id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full hidden md:block">
                          <Bike className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm leading-tight">{rental.vehicleId?.model}</span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">{rental.vehicleId?.plateNumber}</span>
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-foreground/80">
                            <User size={10} /> {rental.customerName}
                            {rental.isManual && (
                              <Badge variant="outline" className="text-[8px] h-3 px-1 border-yellow-200 text-yellow-700 bg-yellow-50">MANUAL</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {rental.isManual ? (
                        <span className="text-xs text-muted-foreground italic text-balance">Update status in Inventory to clear</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a href={`tel:${rental.customerPhone}`} className="hover:text-primary transition-colors">
                            <Phone size={14} className="text-muted-foreground" />
                          </a>
                          <span className="text-xs font-mono">{rental.customerPhone}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => sendWhatsApp(rental)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <MessageCircle size={14} />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 w-fit",
                          timeStatus.color
                        )}>
                          {timeStatus.isOverdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                          {timeStatus.label}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Due: {new Date(rental.expectedEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}, {new Date(rental.expectedEndTime).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[11px]">
                        <span className="text-muted-foreground">Start: <strong>{rental.startKm} km</strong></span>
                        <span className="text-primary font-bold">Deposit: ₹{rental.depositAmount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!rental.isManual && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openDocsModal(rental)}
                            className="h-8 text-xs font-bold gap-1 hidden md:flex"
                          >
                            <FileText size={12} /> Docs
                          </Button>
                        )}
                        <Button 
                          onClick={() => openReturnModal(rental)}
                          className="h-8 text-xs font-bold gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 size={12} /> Return
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Return Vehicle Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="max-w-[98vw] md:max-w-[95vw] 2xl:max-w-[1600px] max-h-[98vh] md:max-h-[95vh] overflow-y-auto p-4 md:p-10 lg:p-16 rounded-xl md:rounded-[2rem] lg:rounded-[3rem]">
          <DialogHeader className="border-b-2 border-primary/5 pb-4 md:pb-8 mb-4">
            <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-black flex items-center gap-2 md:gap-4 tracking-tight">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 md:p-3 rounded-xl md:rounded-2xl">
                <CheckCircle2 className="text-green-600 h-5 w-5 md:h-8 md:w-8" />
              </div>
              <div className="flex flex-col">
                <span>Vehicle Return & Checkout</span>
                <span className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">{selectedRental?.vehicleId?.model} • {selectedRental?.vehicleId?.plateNumber}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleReturnSubmit} className="space-y-8 md:space-y-12 lg:space-y-16">
            {/* INSPECTION SECTION */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground border-l-4 border-primary pl-3 md:pl-4">1. Condition Comparison</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
                {/* PICK-UP DATA (READONLY) */}
                <div className="bg-muted/30 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border-2 border-primary/5 shadow-sm">
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary mb-4 md:mb-6 flex items-center gap-2">
                    <Clock size={14} /> Status at Handover (Before)
                  </h4>
                  <div className="flex justify-between items-center text-xs md:text-sm mb-4 md:mb-6 bg-white/50 dark:bg-black/20 p-3 md:p-4 rounded-lg md:rounded-xl border border-dashed border-primary/20">
                    <span className="text-muted-foreground font-bold uppercase tracking-tight">Start Odometer:</span>
                    <span className="font-mono font-black text-primary text-lg md:text-xl">{selectedRental?.startKm} KM</span>
                  </div>
                  <VehicleInspection 
                    title="Original Condition"
                    readonly 
                    vehicleType={selectedRental?.vehicleId?.type}
                    initialPhotos={selectedRental?.startInspectionPhotos}
                    initialHotspots={selectedRental?.startDamageHotspots}
                    onPhotosChange={() => {}}
                    onHotspotsChange={() => {}}
                  />
                </div>

                {/* DROP-OFF DATA (ACTIONABLE) */}
                <div className="bg-white dark:bg-muted/10 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border-2 border-green-500/20 shadow-xl ring-1 ring-green-500/5">
                  <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-green-600 mb-4 md:mb-6 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Status at Return (After)
                  </h4>
                  <div className="space-y-6 md:space-y-8">
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="endKm" className="text-[10px] md:text-xs font-black uppercase text-green-700">Current Odometer</Label>
                        <div className="relative">
                          <Input 
                            id="endKm" 
                            type="number" 
                            required
                            value={returnForm.endKm}
                            onChange={(e) => setReturnForm({...returnForm, endKm: e.target.value})}
                            placeholder={selectedRental?.vehicleId?.lastKmReading}
                            className="font-mono font-black text-lg md:text-2xl h-12 md:h-16 border-2 border-green-500/30 focus-visible:ring-green-500 rounded-lg md:rounded-xl"
                          />
                          <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600/50">KM</span>
                        </div>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="paymentStatus" className="text-[10px] md:text-xs font-black uppercase text-green-700">Payment Status</Label>
                        <Select 
                          value={returnForm.paymentStatus} 
                          onValueChange={(val: string | null) => setReturnForm({...returnForm, paymentStatus: (val as "Paid" | "Pending") || "Paid"})}
                        >
                          <SelectTrigger id="paymentStatus" className="h-12 md:h-16 border-2 border-green-500/30 font-black text-sm md:text-lg rounded-lg md:rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid" className="font-bold">Paid ✅</SelectItem>
                            <SelectItem value="Pending" className="font-bold text-red-500">Pending ⏳</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <VehicleInspection 
                      title="Mark New Damages"
                      vehicleType={selectedRental?.vehicleId?.type}
                      onPhotosChange={(urls) => setReturnForm({...returnForm, endInspectionPhotos: urls})}
                      onHotspotsChange={(hotspots) => setReturnForm({...returnForm, endDamageHotspots: hotspots})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BILLING SECTION */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground border-l-4 border-primary pl-3 md:pl-4">2. Financial Settlement</h3>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 md:gap-8 lg:gap-10">
                {/* Financial Extras */}
                <div className="bg-muted/20 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border-2 border-dashed border-muted-foreground/20 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4 md:mb-6">Additional Charges</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="damageCharges" className="text-[10px] md:text-xs font-black uppercase">Damage Cost (₹)</Label>
                        <div className="space-y-2 md:space-y-3">
                          <Input 
                            id="damageCharges" 
                            type="number" 
                            value={returnForm.damageCharges}
                            onChange={(e) => setReturnForm({...returnForm, damageCharges: e.target.value})}
                            className="font-black text-lg md:text-2xl text-red-500 h-12 md:h-14 border-2 rounded-lg md:rounded-xl"
                          />
                                                  {settings?.damageCatalog?.length > 0 && (
                                                    <Select onValueChange={(val: string | null) => {
                                                      const item = settings.damageCatalog.find((i: any) => i.name === val);
                                                      if (item) setReturnForm({...returnForm, damageCharges: String(item.price)});
                                                    }}>                              <SelectTrigger className="h-8 md:h-10 text-[10px] bg-white font-bold rounded-lg border-primary/20">
                                <SelectValue placeholder="Quick Damage Catalog" />
                              </SelectTrigger>
                              <SelectContent>
                                {settings.damageCatalog.map((item: any) => (
                                  <SelectItem key={item.name} value={item.name} className="text-xs">
                                    {item.name} (₹{item.price})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        <Label htmlFor="fuelCharges" className="text-[10px] md:text-xs font-black uppercase">Fuel Adjust. (₹)</Label>
                        <Input 
                          id="fuelCharges" 
                          type="number" 
                          value={returnForm.fuelCharges}
                          onChange={(e) => setReturnForm({...returnForm, fuelCharges: e.target.value})}
                          className="font-black text-lg md:text-2xl text-orange-500 h-12 md:h-14 border-2 rounded-lg md:rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-8 flex flex-col gap-3 md:gap-4">
                    <div className="flex items-center space-x-3 md:space-x-4 bg-white dark:bg-black/20 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-primary/5 shadow-sm">
                      <input 
                        type="checkbox" 
                        id="rentPaidAtStart" 
                        className="h-5 w-5 md:h-6 md:w-6 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        checked={returnForm.rentPaidAtStart}
                        onChange={(e) => setReturnForm({...returnForm, rentPaidAtStart: e.target.checked})}
                      />
                      <Label htmlFor="rentPaidAtStart" className="text-[10px] md:text-sm font-black text-primary cursor-pointer uppercase tracking-tight">Rent already collected?</Label>
                    </div>
                    <div className="flex items-center space-x-3 md:space-x-4 bg-blue-50 dark:bg-blue-900/10 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-blue-200 dark:border-blue-900/30">
                      <input 
                        type="checkbox" 
                        id="adjustFromDeposit" 
                        className="h-5 w-5 md:h-6 md:w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={returnForm.adjustFromDeposit}
                        onChange={(e) => setReturnForm({...returnForm, adjustFromDeposit: e.target.checked})}
                      />
                      <Label htmlFor="adjustFromDeposit" className="text-[10px] md:text-sm font-black text-blue-600 cursor-pointer uppercase tracking-tight">Deduct from deposit?</Label>
                    </div>
                  </div>
                </div>

                {/* Billing Summary (ENLARGED) */}
                <div className="flex flex-col">
                  {selectedRental && (() => {
                    const billing = calculateFinalBill(selectedRental, returnForm);
                    return (
                      <div className="bg-primary/5 p-4 md:p-8 lg:p-14 rounded-2xl md:rounded-3xl lg:rounded-[2.5rem] border-2 border-primary/20 shadow-2xl flex-1 space-y-4 md:space-y-6 relative overflow-hidden flex flex-col justify-center min-h-[300px] md:min-h-[400px]">
                        <div className="absolute top-0 right-0 bg-primary/20 px-4 md:px-10 py-1 md:py-3 rounded-bl-xl md:rounded-bl-3xl text-[8px] md:text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-primary">Live Checkout</div>
                        
                        <h4 className="text-[10px] md:text-sm font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-muted-foreground/60 mb-2 md:mb-6 border-b-2 border-primary/5 pb-2 md:pb-4">Settlement Invoice Summary</h4>
                        
                        <div className="space-y-2 md:space-y-4">
                          <div className="flex justify-between text-xs md:text-base">
                            <span className="text-muted-foreground font-semibold">Standard Rental Charges:</span>
                            <span className="font-black text-sm md:text-lg">₹{billing.baseAmount}</span>
                          </div>
                          {billing.lateFees > 0 && (
                            <div className="flex justify-between text-xs md:text-base text-red-600 font-bold bg-red-50 dark:bg-red-950/30 p-2 md:p-4 rounded-lg md:rounded-2xl border-2 border-red-100">
                              <span className="flex items-center gap-2"><Clock size={16} /> Late ({calculateLateFees(selectedRental).hoursLate}h):</span>
                              <span className="text-sm md:text-xl">₹{billing.lateFees}</span>
                            </div>
                          )}
                          {(billing.damage > 0 || billing.fuel > 0) && (
                            <div className="flex justify-between text-xs md:text-base text-orange-600 font-black italic bg-orange-50/30 p-2 md:p-4 rounded-lg md:rounded-2xl border-2 border-dashed border-orange-200">
                              <span>Add-ons:</span>
                              <span className="text-sm md:text-xl">+ ₹{billing.damage + billing.fuel}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-4 md:pt-8 mt-2 md:mt-4 border-t-2 border-primary/10">
                          {billing.isAdjustment ? (
                            <div className="space-y-4 md:space-y-6">
                              <div className="flex justify-between text-[10px] md:text-sm font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                <span>Gross Trip Valuation:</span>
                                <span>₹{billing.netBill}</span>
                              </div>
                              <div className="flex justify-between text-sm md:text-xl text-green-600 font-black bg-green-50 dark:bg-green-950/30 p-3 md:p-5 rounded-xl md:rounded-2xl border-2 border-green-100">
                                <span className="flex items-center gap-2"><IndianRupee size={20} /> Deposit Applied:</span>
                                <span>- ₹{billing.deposit}</span>
                              </div>
                              <div className="pt-6 md:pt-10">
                                {billing.amountToCollect > 0 ? (
                                  <div className="flex justify-between items-center bg-primary text-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-xl shadow-primary/30">
                                    <div className="flex flex-col">
                                      <span className="text-[8px] md:text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Total Balance Due</span>
                                      <span className="text-[8px] md:text-[10px] italic opacity-60 hidden md:block">To be collected from customer</span>
                                    </div>
                                    <span className="font-black text-4xl md:text-7xl tracking-tighter">₹{billing.amountToCollect}</span>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-center bg-green-600 text-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-xl shadow-green-600/30">
                                    <div className="flex flex-col">
                                      <span className="text-[8px] md:text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1">Total Refund Due</span>
                                      <span className="text-[8px] md:text-[10px] italic opacity-60 hidden md:block">To be returned to customer</span>
                                    </div>
                                    <span className="font-black text-4xl md:text-7xl tracking-tighter">₹{billing.refundToCustomer}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 md:space-y-8">
                              <div className="bg-white dark:bg-black/30 p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] border-2 md:border-4 border-primary/10 shadow-2xl relative">
                                <div className="flex justify-between items-center mb-2 md:mb-6">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] md:text-sm font-black uppercase text-primary tracking-[0.2em] mb-1">Net Payable</span>
                                    <span className="text-[8px] md:text-[10px] text-muted-foreground font-bold">Rental + Extras</span>
                                  </div>
                                  <span className="font-black text-4xl md:text-7xl text-primary tracking-tighter">₹{billing.amountToCollect}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-600 border-t-2 border-green-50 pt-3 md:pt-6 mt-3 md:mt-6">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] mb-1">Refund Deposit</span>
                                    <span className="text-[8px] md:text-[10px] font-bold opacity-60">Full Security Return</span>
                                  </div>
                                  <span className="font-black text-xl md:text-4xl tracking-tighter">₹{billing.refundToCustomer}</span>
                                </div>
                              </div>
                              <p className="text-[8px] md:text-[11px] text-primary/60 italic text-center uppercase tracking-[0.2em] md:tracking-[0.3em] font-black bg-primary/5 py-2 md:py-4 rounded-xl md:rounded-2xl border border-primary/10">Cash or UPI Settlement Required</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 md:pt-10 border-t gap-3 md:gap-4 flex-col sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setIsReturnModalOpen(false)} className="h-12 md:h-16 px-6 md:px-10 font-black text-muted-foreground uppercase tracking-widest text-[10px] md:text-xs">Cancel</Button>
              <Button type="submit" className="h-14 md:h-16 px-10 md:px-16 bg-green-600 hover:bg-green-700 text-lg md:text-2xl font-black uppercase tracking-tight shadow-2xl shadow-green-600/30 group rounded-xl md:rounded-2xl" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin h-6 w-6 md:h-8 md:w-8" /> : (
                  <div className="flex items-center gap-2 md:gap-4">
                    Finalize & Print
                    <ChevronRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-2 transition-transform" />
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Documents Modal */}
      <Dialog open={isDocsModalOpen} onOpenChange={setIsDocsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="text-primary" />
              Customer Documents: {selectedRental?.customerName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 grid grid-cols-1 gap-6 overflow-y-auto max-h-[70vh] p-1">
            {/* ID Proofs */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <FileText size={14} /> Identity Documents
              </h4>
              {selectedRental?.idPhotoUrl && selectedRental.idPhotoUrl.length > 0 ? (
                selectedRental.idPhotoUrl.map((url: string, idx: number) => (
                  <DocItem key={idx} url={url} label={`ID Page ${idx + 1}`} onPrint={() => printImage(url)} />
                ))
              ) : (
                <EmptyDocs message="No ID photos found." />
              )}
            </div>

            {/* Inspection Photos (Before) */}
            {selectedRental?.startInspectionPhotos?.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2">
                  <Camera size={14} /> Condition Photos (At Pick-up)
                </h4>
                {selectedRental.startInspectionPhotos.map((url: string, idx: number) => (
                  <DocItem key={idx} url={url} label={`Inspection ${idx + 1}`} onPrint={() => printImage(url)} />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDocsModalOpen(false)} className="w-full">
              Close Viewer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocItem({ url, label, onPrint }: { url: string, label: string, onPrint: () => void }) {
  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{label}</p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            title="Open Full Image"
            onClick={() => window.open(url, "_blank")}
            className="h-7 w-7"
          >
            <Maximize2 size={12} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            title="Print"
            onClick={onPrint}
            className="h-7 w-7 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Printer size={12} />
          </Button>
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border-2 border-muted bg-muted/20 aspect-video flex items-center justify-center relative">
        <img 
          src={url} 
          alt={label} 
          className="w-full h-full object-contain cursor-pointer"
          loading="lazy"
          onClick={() => window.open(url, "_blank")}
        />
      </div>
    </div>
  );
}

function EmptyDocs({ message }: { message: string }) {
  return (
    <div className="text-center p-8 border-2 border-dashed rounded-xl">
      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-20" />
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
