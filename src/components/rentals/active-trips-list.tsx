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
  Maximize2
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

interface ActiveTripsListProps {
  initialRentals: any[];
}

export function ActiveTripsList({ initialRentals }: ActiveTripsListProps) {
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
    adjustFromDeposit: false
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
      adjustFromDeposit: false
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
    // Example: 100 Rs per hour late fee
    const lateFees = hoursLate * 100; 
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
                            size="icon-xs" 
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600" />
              Complete Rental: {selectedRental?.vehicleId?.model}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleReturnSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endKm" className="text-xs font-bold uppercase">End KM Reading</Label>
                <Input 
                  id="endKm" 
                  type="number" 
                  required
                  value={returnForm.endKm}
                  onChange={(e) => setReturnForm({...returnForm, endKm: e.target.value})}
                  placeholder={selectedRental?.vehicleId?.lastKmReading}
                />
                <p className="text-[10px] text-muted-foreground italic">Start was {selectedRental?.startKm} km</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus" className="text-xs font-bold uppercase">Payment Status</Label>
                <Select 
                  value={returnForm.paymentStatus} 
                  onValueChange={(val: any) => setReturnForm({...returnForm, paymentStatus: val})}
                >
                  <SelectTrigger id="paymentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="damageCharges" className="text-xs font-bold uppercase">Damage Charges (₹)</Label>
                <Input 
                  id="damageCharges" 
                  type="number" 
                  value={returnForm.damageCharges}
                  onChange={(e) => setReturnForm({...returnForm, damageCharges: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelCharges" className="text-xs font-bold uppercase">Fuel Charges (₹)</Label>
                <Input 
                  id="fuelCharges" 
                  type="number" 
                  value={returnForm.fuelCharges}
                  onChange={(e) => setReturnForm({...returnForm, fuelCharges: e.target.value})}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-muted/30 p-3 rounded-lg border border-dashed border-primary/30">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="rentPaidAtStart" 
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={returnForm.rentPaidAtStart}
                  onChange={(e) => setReturnForm({...returnForm, rentPaidAtStart: e.target.checked})}
                />
                <Label htmlFor="rentPaidAtStart" className="text-xs font-bold text-primary cursor-pointer">Rent already paid at Start?</Label>
              </div>
              <div className="flex items-center space-x-2 border-t border-primary/10 pt-1 mt-1">
                <input 
                  type="checkbox" 
                  id="adjustFromDeposit" 
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={returnForm.adjustFromDeposit}
                  onChange={(e) => setReturnForm({...returnForm, adjustFromDeposit: e.target.checked})}
                />
                <Label htmlFor="adjustFromDeposit" className="text-xs font-bold text-blue-600 cursor-pointer">Adjust from Deposit? (Adjustment Option)</Label>
              </div>
            </div>

            {selectedRental && (() => {
              const billing = calculateFinalBill(selectedRental, returnForm);
              return (
                <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Base Rent:</span>
                    <span>₹{billing.baseAmount}</span>
                  </div>
                  {billing.lateFees > 0 && (
                    <div className="flex justify-between text-xs text-red-600">
                      <span>Late Fees ({calculateLateFees(selectedRental).hoursLate}h):</span>
                      <span>₹{billing.lateFees}</span>
                    </div>
                  )}
                  {(billing.damage > 0 || billing.fuel > 0) && (
                    <div className="flex justify-between text-xs text-red-500 font-medium">
                      <span>Damages/Fuel Extras:</span>
                      <span>+ ₹{billing.damage + billing.fuel}</span>
                    </div>
                  )}
                  
                  <div className="h-[1px] bg-border my-2" />

                  {billing.isAdjustment ? (
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold">
                        <span>Net Bill to Collect:</span>
                        <span>₹{billing.netBill}</span>
                      </div>
                      <div className="flex justify-between text-xs text-green-600 font-medium">
                        <span>Security Deposit (Subtract):</span>
                        <span>- ₹{billing.deposit}</span>
                      </div>
                      <div className="border-t pt-2 flex flex-col gap-1">
                        {billing.amountToCollect > 0 ? (
                          <div className="flex justify-between font-bold text-lg text-primary">
                            <span>Balance to Pay:</span>
                            <span>₹{billing.amountToCollect}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between font-bold text-lg text-green-600">
                            <span>Refund to Customer:</span>
                            <span>₹{billing.refundToCustomer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-base text-primary">
                        <span>Rent to Collect Now:</span>
                        <span>₹{billing.amountToCollect}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-green-600">
                        <span>Deposit to Refund Now:</span>
                        <span>₹{billing.refundToCustomer}</span>
                      </div>
                      <div className="border-t border-muted-foreground/10 pt-1">
                         <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-wider">Separate Hand-to-Hand Transactions</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isPending}>
                {isPending ? "Processing..." : "Complete Return & Bill"}
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
            {selectedRental?.idPhotoUrl && selectedRental.idPhotoUrl.length > 0 ? (
              selectedRental.idPhotoUrl.map((url: string, idx: number) => (
                <div key={idx} className="space-y-3 group">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Document Page {idx + 1}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon-xs" 
                        title="Open Full Image"
                        onClick={() => window.open(url, "_blank")}
                        className="h-7 w-7"
                      >
                        <Maximize2 size={12} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon-xs" 
                        title="Save Image"
                        nativeButton={false}
                        render={
                          <a href={url} download={`document_${selectedRental.customerPhone}_${idx+1}.jpg`} target="_blank">
                            <Download size={12} />
                          </a>
                        }
                        className="h-7 w-7"
                      />
                      <Button 
                        variant="outline" 
                        size="icon-xs" 
                        title="Print Document"
                        onClick={() => printImage(url)}
                        className="h-7 w-7 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Printer size={12} />
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden border-2 border-muted bg-muted/20 aspect-video flex items-center justify-center relative">
                    <img 
                      src={url} 
                      alt={`Customer ID Proof ${idx + 1}`} 
                      className="w-full h-full object-contain cursor-pointer"
                      loading="lazy"
                      onClick={() => window.open(url, "_blank")}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-xl">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground font-medium">No document photos found for this rental.</p>
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
