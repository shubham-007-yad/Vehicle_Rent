"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Maximize2, Download, Printer, MessageCircle, Camera, Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { VehicleInspection } from "./vehicle-inspection";

interface RentalDetailsModalProps {
  rental: any;
  isOpen: boolean;
  onClose: () => void;
}

export function RentalDetailsModal({
  rental,
  isOpen,
  onClose,
}: RentalDetailsModalProps) {
  const [showInspections, setShowInspections] = useState(false);
  if (!rental) return null;

  const vehicle = rental.vehicleId;

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

  const printReceipt = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const baseRent = rental.baseRateAtBooking || 0;
    const lateFees = rental.lateFees || 0;
    const damage = rental.damageCharges || 0;
    const fuel = rental.fuelCharges || 0;
    const deposit = rental.depositAmount || 0;
    const netBill = rental.totalAmount || 0;

    const collectNowBase = rental.rentPaidAtStart 
      ? (damage + fuel)
      : netBill;

    let amountToCollect = 0;
    let refundToCustomer = 0;

    if (rental.adjustFromDeposit) {
      if (deposit >= collectNowBase) {
        refundToCustomer = deposit - collectNowBase;
        amountToCollect = 0;
      } else {
        amountToCollect = collectNowBase - deposit;
        refundToCustomer = 0;
      }
    } else {
      amountToCollect = collectNowBase;
      refundToCustomer = deposit;
    }

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt - Varanasi Rentals</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              width: 72mm; 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              font-size: 11px; 
              line-height: 1.4;
              padding: 4mm;
              margin: 0 auto;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .italic { font-style: italic; }
            .uppercase { text-transform: uppercase; }
            .header-title { font-size: 18px; margin-bottom: 2px; letter-spacing: 1px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .thick-divider { border-top: 2px solid #000; margin: 8px 0; }
            .flex { display: flex; justify-content: space-between; }
            .section-title { 
              font-size: 10px; 
              border-bottom: 1px solid #eee; 
              margin-bottom: 5px; 
              padding-bottom: 2px;
              letter-spacing: 0.5px;
            }
            .total-row { font-size: 14px; margin-top: 5px; }
            .footer { font-size: 9px; margin-top: 15px; color: #444; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div class="center">
            <div class="header-title bold italic uppercase">Varanasi Rentals</div>
            <div class="bold" style="font-size: 10px;">PREMIUM BIKE & SCOOTER RENTALS</div>
            <div style="font-size: 9px;">Assi Ghat Main Road, Near Kashi Mumukshu Bhawan</div>
            <div style="font-size: 9px;">Varanasi, Uttar Pradesh - 221005</div>
            <div style="font-size: 10px;" class="bold">Mob: +91 92829 78283</div>
          </div>
          
          <div class="thick-divider"></div>
          
          <div class="flex"><span>Date: ${format(new Date(rental.actualEndTime || rental.updatedAt), "dd MMM yyyy")}</span> <span>Time: ${format(new Date(rental.actualEndTime || rental.updatedAt), "hh:mm a")}</span></div>
          <div class="flex"><span>Receipt No:</span> <span class="bold">VR-${rental._id.toString().slice(-6).toUpperCase()}</span></div>
          
          <div class="divider"></div>
          
          <div class="section-title bold uppercase">Customer Details</div>
          <div class="flex"><span>Name:</span> <span class="bold">${rental.customerName}</span></div>
          <div class="flex"><span>Phone:</span> <span>+91 ${rental.customerPhone}</span></div>
          
          <div class="divider"></div>
          
          <div class="section-title bold uppercase">Ride Information</div>
          <div class="flex"><span>Vehicle:</span> <span class="bold">${rental.vehicleId?.model}</span></div>
          <div class="flex"><span>Plate No:</span> <span class="bold uppercase">${rental.vehicleId?.plateNumber}</span></div>
          <div class="flex"><span>Distance:</span> <span>${rental.startKm} km - ${rental.endKm || rental.startKm} km</span></div>
          <div class="flex"><span>Total Run:</span> <span class="bold">${(rental.endKm || rental.startKm) - rental.startKm} KM</span></div>
          
          <div class="thick-divider"></div>
          
          <div class="section-title bold uppercase">Billing Summary</div>
          <div class="flex"><span>Rental Charges:</span> <span>₹${baseRent.toLocaleString("en-IN")}</span></div>
          ${lateFees > 0 ? `<div class="flex"><span>Late Returns:</span> <span>₹${lateFees.toLocaleString("en-IN")}</span></div>` : ""}
          ${damage > 0 ? `<div class="flex text-red-600"><span>Damage Charges:</span> <span>₹${damage.toLocaleString("en-IN")}</span></div>` : ""}
          ${fuel > 0 ? `<div class="flex"><span>Fuel Adjustments:</span> <span>₹${fuel.toLocaleString("en-IN")}</span></div>` : ""}
          
          <div class="divider"></div>
          
          <div class="flex bold" style="font-size: 12px;">
            <span>NET BILLABLE AMOUNT:</span> 
            <span>₹${netBill.toLocaleString("en-IN")}</span>
          </div>

          <div class="divider"></div>
          
          <div class="section-title bold uppercase">Settlement Details</div>
          <div class="flex"><span>Security Deposit:</span> <span>₹${deposit.toLocaleString("en-IN")}</span></div>
          ${rental.adjustFromDeposit 
            ? `<div class="flex italic"><span>(Adjusted against bill)</span> <span class="bold">-₹${Math.min(deposit, collectNowBase).toLocaleString("en-IN")}</span></div>` 
            : `<div class="flex italic"><span>(Refunded Hand-to-Hand)</span> <span class="bold">₹${deposit.toLocaleString("en-IN")}</span></div>`
          }
          
          <div class="divider"></div>
          
          <div class="flex total-row bold uppercase">
            <span>${amountToCollect > 0 ? "Amount Collected:" : "Final Settlement:"}</span>
            <span>₹${(amountToCollect > 0 ? amountToCollect : 0).toLocaleString("en-IN")}</span>
          </div>
          <div class="flex"><span>Payment Mode:</span> <span class="bold uppercase">${rental.paymentMethod || "N/A"}</span></div>
          
          <div class="thick-divider"></div>
          
          <div class="center footer">
            <div class="bold italic">Thank you for riding with Varanasi Rentals!</div>
            <div>We hope you enjoyed the spiritual vibes of Kashi.</div>
            <div style="margin-top: 5px;">Follow us on Instagram @VaranasiRentals</div>
            <div class="bold uppercase" style="margin-top: 8px; font-size: 8px; letter-spacing: 2px;">*** VISIT AGAIN ***</div>
          </div>
        </body>
      </html>
    `;

    win.document.write(receiptHtml);
    win.document.close();
  };

  const shareOnWhatsApp = () => {
    const baseRent = rental.baseRateAtBooking || 0;
    const lateFees = rental.lateFees || 0;
    const damage = rental.damageCharges || 0;
    const fuel = rental.fuelCharges || 0;
    const netBill = rental.totalAmount || 0;

    const message = `Namaste ${rental.customerName}! 🙏

Thank you for choosing *Varanasi Rentals*. Here is your final bill summary:

*Vehicle:* ${rental.vehicleId?.model} (${rental.vehicleId?.plateNumber})
- Net Bill: *₹${netBill}*
- Deposit (₹${rental.depositAmount}) has been ${rental.adjustFromDeposit ? "Adjusted" : "Refunded"}.

Payment Mode: ${rental.paymentMethod || "N/A"}

Safe travels in Kashi! 🕉️`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${rental.customerPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span>Rental Details</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={printReceipt} title="Print Receipt">
                  <Printer size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={shareOnWhatsApp} title="WhatsApp Bill">
                  <MessageCircle size={16} />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {rental.rentPaidAtStart && (
                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                  Rent Paid at Start
                </Badge>
              )}
              {rental.adjustFromDeposit && (
                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                  Adjusted from Deposit
                </Badge>
              )}
              {rental.paymentMethod && (
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                  Method: {rental.paymentMethod}
                </Badge>
              )}
              <Badge variant={rental.paymentStatus === "Paid" ? "default" : "destructive"}>
                {rental.paymentStatus}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary">Customer Information</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Name:</span> {rental.customerName}</p>
              <p><span className="text-muted-foreground">Phone:</span> {rental.customerPhone}</p>
              <p><span className="text-muted-foreground">Aadhaar:</span> {rental.aadhaarNumber || "N/A"}</p>
              <p><span className="text-muted-foreground">DL:</span> {rental.dlNumber || "N/A"}</p>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary">Vehicle Information</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Vehicle:</span> {vehicle?.make} {vehicle?.model}</p>
              <p><span className="text-muted-foreground">Plate No:</span> {vehicle?.plateNumber}</p>
              <p><span className="text-muted-foreground">Type:</span> {vehicle?.type}</p>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trip Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary">Trip Timeline</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Started:</span> {format(new Date(rental.startTime), "PPp")}</p>
              <p><span className="text-muted-foreground">Ended:</span> {rental.actualEndTime ? format(new Date(rental.actualEndTime), "PPp") : "N/A"}</p>
              <p><span className="text-muted-foreground">Start KM:</span> {rental.startKm}</p>
              <p><span className="text-muted-foreground">End KM:</span> {rental.endKm || "N/A"}</p>
            </div>
          </div>

          {/* Billing Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-primary">Billing Breakdown</h3>
            <div className="text-sm space-y-1 bg-muted/30 p-3 rounded-lg border">
              <div className="flex justify-between">
                <span>Base Rent:</span>
                <span>₹{rental.baseRateAtBooking}</span>
              </div>
              <div className="flex justify-between">
                <span>Late Fees:</span>
                <span>+ ₹{rental.lateFees}</span>
              </div>
              <div className="flex justify-between">
                <span>Damage:</span>
                <span>+ ₹{rental.damageCharges}</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel:</span>
                <span>+ ₹{rental.fuelCharges}</span>
              </div>
              
              <div className="flex justify-between font-bold pt-1 border-t border-muted-foreground/10">
                <span>Net Bill:</span>
                <span>₹{rental.totalAmount}</span>
              </div>

              <div className="h-[1px] bg-border my-2" />
              
              {(() => {
                const netBill = rental.totalAmount || 0;
                const deposit = rental.depositAmount || 0;
                
                // What they owed at return
                const collectNow = rental.rentPaidAtStart 
                  ? ((rental.damageCharges || 0) + (rental.fuelCharges || 0))
                  : netBill;

                if (rental.adjustFromDeposit) {
                  let refundAmount = 0;
                  let balanceAmount = 0;
                  
                  if (deposit >= collectNow) {
                    refundAmount = deposit - collectNow;
                    balanceAmount = 0;
                  } else {
                    balanceAmount = collectNow - deposit;
                    refundAmount = 0;
                  }

                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-green-600">
                        <span>Security Deposit (Subtract):</span>
                        <span>- ₹{deposit}</span>
                      </div>
                      <div className="h-[1px] bg-border my-1" />
                      {balanceAmount > 0 ? (
                        <div className="flex justify-between font-bold text-base text-primary">
                          <span>Balance Paid:</span>
                          <span>₹{balanceAmount}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between font-bold text-base text-green-600">
                          <span>Amount Refunded:</span>
                          <span>₹{refundAmount}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-center font-bold uppercase tracking-widest pt-1 border-t border-muted-foreground/10 text-muted-foreground">
                        {rental.isDepositRefunded 
                          ? "Security Deposit Fully Refunded" 
                          : rental.adjustFromDeposit 
                            ? "Deposit Adjusted against Bill" 
                            : "Deposit Status: Not Recorded"}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-base text-primary">
                        <span>Rent Collected:</span>
                        <span>₹{collectNow}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-green-600">
                        <span>Deposit Refunded:</span>
                        <span>₹{deposit}</span>
                      </div>
                      <div className="border-t border-muted-foreground/10 pt-1">
                         <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-wider">Separate Hand-to-Hand Transactions</p>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border my-4" />

        {/* Condition Reports Toggle */}
        <Button 
          variant="outline" 
          className="w-full flex justify-between items-center py-6 border-dashed hover:bg-muted/50 transition-all"
          onClick={() => setShowInspections(!showInspections)}
        >
          <div className="flex items-center gap-2 font-bold text-primary uppercase tracking-wider text-xs">
            <Camera size={16} /> Vehicle Condition Inspection Reports
          </div>
          {showInspections ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>

        {showInspections && (
          <div className="mt-4 space-y-8 animate-in slide-in-from-top-2 duration-300">
            {/* Pick-up Inspection */}
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <Clock size={12} /> Inspection at Pick-up (Handover)
              </h4>
              <VehicleInspection 
                readonly 
                title="Pick-up Condition"
                vehicleType={vehicle?.type}
                initialPhotos={rental.startInspectionPhotos}
                initialHotspots={rental.startDamageHotspots}
                onPhotosChange={() => {}}
                onHotspotsChange={() => {}}
              />
            </div>

            {/* Return Inspection */}
            {rental.status === "Completed" || rental.status === "Pending-Payment" ? (
              <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-xl border border-green-200 dark:border-green-900/50">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Inspection at Return (Drop-off)
                </h4>
                <VehicleInspection 
                  readonly 
                  title="Return Condition"
                  vehicleType={vehicle?.type}
                  initialPhotos={rental.endInspectionPhotos}
                  initialHotspots={rental.endDamageHotspots}
                  onPhotosChange={() => {}}
                  onHotspotsChange={() => {}}
                />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed rounded-xl text-center">
                <p className="text-sm text-muted-foreground italic">Vehicle is still on the road. Return inspection pending.</p>
              </div>
            )}
          </div>
        )}

        <div className="h-[1px] bg-border my-4" />

        {/* KYC Documents */}
        <div className="space-y-4">
          <h3 className="font-semibold text-primary">KYC Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rental.idPhotoUrl && rental.idPhotoUrl.map((url: string, index: number) => (
              <div key={index} className="space-y-2 group">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Document Page {index + 1}</p>
                   <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Open Full Image"
                        onClick={() => window.open(url, "_blank")}
                        className="h-8 w-8"
                      >
                        <Maximize2 size={14} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Save Image"
                        nativeButton={false}
                        render={
                          <a href={url} download={`history_doc_${rental.customerPhone}_${index+1}.jpg`} target="_blank">
                            <Download size={14} />
                          </a>
                        }
                        className="h-8 w-8"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Print Document"
                        onClick={() => printImage(url)}
                        className="h-8 w-8 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Printer size={14} />
                      </Button>
                    </div>
                </div>
                <div className="aspect-video relative rounded-lg overflow-hidden border-2 bg-muted flex items-center justify-center">
                  <img 
                    src={url} 
                    alt={`KYC Doc ${index + 1}`} 
                    className="object-contain w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(url, "_blank")}
                  />
                </div>
              </div>
            ))}
            {(!rental.idPhotoUrl || rental.idPhotoUrl.length === 0) && (
              <p className="text-sm text-muted-foreground">No photos available</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
