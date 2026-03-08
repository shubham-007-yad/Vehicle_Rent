"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  IndianRupee, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  Printer,
  FileText,
  AlertTriangle,
  Coins,
  MessageCircle
} from "lucide-react";
import { processPayment } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PaymentFormProps {
  rental: any;
}

export function PaymentForm({ rental }: PaymentFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [isDepositRefunded, setIsDepositRefunded] = useState(rental.adjustFromDeposit ? false : true);

  // Billing calculation logic (matches active-trips-list.tsx)
  const baseRent = rental.baseRateAtBooking || 0;
  const lateFees = rental.lateFees || 0;
  const damage = rental.damageCharges || 0;
  const fuel = rental.fuelCharges || 0;
  const deposit = rental.depositAmount || 0;
  
  const netBill = baseRent + lateFees + damage + fuel;
  
  // If rent was paid at start, we only collect extras
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

  const handleFinalSubmit = async () => {
    setIsPending(true);
    const result = await processPayment(rental._id, {
      paymentMethod,
      paymentStatus: "Paid",
      isDepositRefunded: isDepositRefunded
    });

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Transaction Completed! Record archived.");
      router.push("/dashboard/history");
    }
    setIsPending(false);
  };

  const printReceipt = () => {
    const win = window.open("", "_blank");
    if (!win) return;

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
            .qr-placeholder { 
              width: 30mm; 
              height: 30mm; 
              border: 1px solid #ccc; 
              margin: 10px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: #888;
            }
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
          
          <div class="flex"><span>Date: ${format(new Date(), "dd MMM yyyy")}</span> <span>Time: ${format(new Date(), "hh:mm a")}</span></div>
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
          <div class="flex"><span>Payment Mode:</span> <span class="bold uppercase">${paymentMethod}</span></div>
          
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
    const message = `Namaste ${rental.customerName}! 🙏

Thank you for choosing *Varanasi Rentals*. Your ride is complete!

*Final Bill Summary:*
- Vehicle: ${rental.vehicleId?.model} (${rental.vehicleId?.plateNumber})
- Base Rent: ₹${baseRent}
${lateFees > 0 ? `- Late Fees: ₹${lateFees}\n` : ""}${damage > 0 ? `- Damages: ₹${damage}\n` : ""}${fuel > 0 ? `- Fuel: ₹${fuel}\n` : ""}- *Net Bill: ₹${netBill}*

*Settlement:*
- Security Deposit (₹${deposit}) has been ${rental.adjustFromDeposit ? "*Adjusted*" : "*Refunded*"}.
${amountToCollect > 0 ? `- *Final Balance Paid: ₹${amountToCollect}*` : `- *Final Refund: ₹${refundToCustomer}*`}
- Payment Mode: ${paymentMethod}

We hope you enjoyed Kashi! 🕉️
Safe travels!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${rental.customerPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column: Summary */}
      <div className="space-y-6">
        <Card className="border-2">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Bill Summary</span>
              <Badge variant="outline" className="text-[10px] font-mono tracking-tighter uppercase">
                {rental.vehicleId?.plateNumber}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Rent:</span>
                <span className="font-medium">₹{baseRent}</span>
              </div>
              {lateFees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-500">Late Fees:</span>
                  <span className="font-medium text-red-500">₹{lateFees}</span>
                </div>
              )}
              {damage > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-500 font-medium italic underline decoration-wavy">Damage Charges:</span>
                  <span className="font-medium text-red-500">₹{damage}</span>
                </div>
              )}
              {fuel > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-500 font-medium italic underline decoration-wavy">Fuel Charges:</span>
                  <span className="font-medium text-blue-500">₹{fuel}</span>
                </div>
              )}
              
              <div className="h-px bg-border my-2" />
              
              <div className="flex justify-between font-bold text-lg">
                <span className="italic">Net Bill (A):</span>
                <span>₹{netBill}</span>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border-2 border-green-100 dark:border-green-900/30 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Coins className="text-green-600 h-5 w-5" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-400">Security Deposit (B):</span>
                </div>
                <span className="font-bold text-lg text-green-700 dark:text-green-400">₹{deposit}</span>
              </div>
              {rental.adjustFromDeposit && (
                <p className="text-[10px] text-green-600 font-medium italic">* Adjusted against final bill as per request.</p>
              )}
            </div>

            <div className="space-y-4 pt-4">
              {amountToCollect > 0 && (
                <div className="flex justify-between items-end p-4 bg-primary/5 rounded-2xl border-2 border-primary/20">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase text-primary/70 tracking-widest">Collect From Customer</span>
                    <span className="text-3xl font-black italic text-primary">₹{amountToCollect}</span>
                  </div>
                  <IndianRupee size={32} className="text-primary/20 mb-1" />
                </div>
              )}

              {refundToCustomer > 0 && (
                <div className="flex justify-between items-end p-4 bg-green-500/10 rounded-2xl border-2 border-green-500/30">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase text-green-600/70 tracking-widest">Refund To Customer</span>
                    <span className="text-3xl font-black italic text-green-600">₹{refundToCustomer}</span>
                  </div>
                  <Wallet size={32} className="text-green-600/20 mb-1" />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 pt-4 flex flex-col gap-3">
             <div className="flex items-center gap-2 w-full text-[10px] font-bold uppercase text-muted-foreground tracking-tighter justify-center">
                <CheckCircle2 size={12} /> Verification Completed & Vehicle Checked
             </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right Column: Actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg italic">Process Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase text-muted-foreground">How did the customer pay?</Label>
              <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || "Cash")}>
                <SelectTrigger id="paymentMethod" className="w-full h-12 text-sm font-bold italic border-2 border-muted hover:border-primary/50 transition-all">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      <span>Cash</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="UPI">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>UPI / GPay</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Mixed">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>Mixed (Cash + UPI)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Deposit Closure</Label>
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-primary/20">
                <input 
                  type="checkbox" 
                  id="depositRefunded" 
                  className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  checked={isDepositRefunded}
                  onChange={(e) => setIsDepositRefunded(e.target.checked)}
                />
                <Label htmlFor="depositRefunded" className="font-bold text-sm cursor-pointer select-none">Confirm Deposit Refunded to Customer</Label>
              </div>
              {!isDepositRefunded && refundToCustomer > 0 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded border border-yellow-200 uppercase tracking-tight">
                  <AlertTriangle size={14} /> Warning: You are marking payment as complete without refunding deposit!
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
             <Button 
              className="w-full h-14 text-lg font-black italic gap-2 bg-primary hover:bg-primary/90"
              onClick={handleFinalSubmit}
              disabled={isPending}
             >
               {isPending ? "Archiving Record..." : "Confirm & Close Rental"}
               <ArrowRight size={20} />
             </Button>

             <div className="grid grid-cols-2 gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-[10px] font-bold italic h-9 uppercase"
                  onClick={printReceipt}
                >
                  <Printer size={12} /> Print Receipt
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-[10px] font-bold italic h-9 uppercase text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={shareOnWhatsApp}
                >
                  <MessageCircle size={12} /> WhatsApp Bill
                </Button>
             </div>
          </CardFooter>
        </Card>

        <div className="text-center">
           <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest leading-relaxed">
             Trip Started: {format(new Date(rental.startTime), "PPpp")}<br/>
             Trip Ended: {rental.actualEndTime ? format(new Date(rental.actualEndTime), "PPpp") : "Just Now"}
           </p>
        </div>
      </div>
    </div>
  );
}
