"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Bike, 
  User, 
  Phone, 
  MapPin, 
  IndianRupee, 
  Calendar as CalendarIcon, 
  Fuel, 
  Camera,
  Save,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { createRental, searchCustomerByPhone } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { KYCCamera } from "./kyc-camera";
import { VehicleInspection } from "./vehicle-inspection";

const formSchema = z.object({
  vehicleId: z.string().min(1, "Please select a vehicle"),
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().length(10, "Must be a 10-digit number"),
  idPhotoUrl: z.array(z.string()).min(1, "At least one ID photo is required"),
  startKm: z.number().min(0, "Invalid KM reading"),
  expectedEndTime: z.date({
    message: "Return date is required",
  }),
  depositAmount: z.number().min(0, "Deposit amount required"),
  startFuel: z.number().min(1).max(5),
  baseRateAtBooking: z.number(),
  totalAmount: z.number(),
  startInspectionPhotos: z.array(z.string()),
});

export function CheckInForm({ availableVehicles, settings }: { availableVehicles: any[], settings: any }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [repeatCustomer, setRepeatCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: "",
      customerName: "",
      customerPhone: "",
      idPhotoUrl: [], 
      startKm: 0,
      startFuel: 3,
      depositAmount: settings?.defaultDepositBike || 2000,
      baseRateAtBooking: 0,
      totalAmount: 0,
      startInspectionPhotos: [],
    },
  });

  // Repeat Customer Detection
  const phone = form.watch("customerPhone");
  useEffect(() => {
    async function checkCustomer() {
      if (phone.length === 10) {
        setIsSearching(true);
        const result = await searchCustomerByPhone(phone);
        if (result.success && result.customer) {
          setRepeatCustomer(result.customer);
          toast.success(`Repeat Customer: ${result.customer.customerName} found!`, {
            description: "You can auto-fill their previous details.",
            duration: 5000,
          });
        }
        setIsSearching(false);
      } else {
        setRepeatCustomer(null);
      }
    }
    checkCustomer();
  }, [phone]);

  const autoFillCustomer = () => {
    if (repeatCustomer) {
      form.setValue("customerName", repeatCustomer.customerName);
      form.setValue("idPhotoUrl", repeatCustomer.idPhotoUrl);
      toast.info("Customer details and KYC photos auto-filled.");
    }
  };

  // Dynamic calculations
  const expectedReturn = form.watch("expectedEndTime");
  
  useEffect(() => {
    if (selectedVehicle && expectedReturn) {
      const now = new Date();
      const diffMs = expectedReturn.getTime() - now.getTime();
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const total = days * selectedVehicle.baseRatePerDay;
      
      form.setValue("totalAmount", total);
      form.setValue("baseRateAtBooking", selectedVehicle.baseRatePerDay);

      // Auto-set deposit based on vehicle type from settings
      if (selectedVehicle.type === "Scooter") {
        form.setValue("depositAmount", settings?.defaultDepositScooter || 1000);
      } else if (selectedVehicle.type === "Bike") {
        form.setValue("depositAmount", settings?.defaultDepositBike || 2000);
      } else if (selectedVehicle.type === "Car") {
        form.setValue("depositAmount", settings?.defaultDepositCar || 5000);
      }
    }
  }, [selectedVehicle, expectedReturn, form, settings]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    const result = await createRental(values);
    
    if (result.error) {
      toast.error(result.error);
      setIsPending(false);
    } else {
      toast.success("Check-In complete! Trip is now Active.");
      router.push("/dashboard/active-trips");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section 1: Customer & KYC */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-primary/10">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <User className="h-4 w-4" /> Customer KYC (Check-In)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {repeatCustomer && (
                  <div className="md:col-span-2 bg-primary/10 border-2 border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary p-2 rounded-full">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight text-primary">Repeat Customer found!</p>
                        <p className="text-[10px] font-medium text-muted-foreground italic">Last seen on {format(new Date(repeatCustomer.actualEndTime || repeatCustomer.updatedAt), "PPP")}</p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm" 
                      onClick={autoFillCustomer}
                      className="font-bold text-[10px] uppercase h-8 px-4"
                    >
                      Auto-fill Details
                    </Button>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Customer Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">+91</span>
                          <Input 
                            type="tel"
                            maxLength={10}
                            className="pl-12 font-mono" 
                            placeholder="9876543210" 
                            {...field} 
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value);
                            }}
                          />
                          {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-xs font-bold uppercase">Identity Proofs (License, Aadhaar, PAN)</Label>
                  <FormField
                    control={form.control}
                    name="idPhotoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <KYCCamera 
                            initialImages={field.value}
                            onImagesChange={(urls) => field.onChange(urls)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <MapPin className="h-4 w-4" /> Trip Mechanics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Starting KM (Odometer)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={field.value === 0 ? "" : field.value}
                          onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          className="font-mono font-bold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startFuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Fuel Level (1-5 Bars)</FormLabel>
                      <FormControl>
                        <Select 
                          value={String(field.value)} 
                          onValueChange={v => field.onChange(Number(v || "3"))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Bar (Low)</SelectItem>
                            <SelectItem value="2">2 Bars</SelectItem>
                            <SelectItem value="3">3 Bars (Half)</SelectItem>
                            <SelectItem value="4">4 Bars</SelectItem>
                            <SelectItem value="5">5 Bars (Full)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedEndTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-bold uppercase">Expected Return Date</FormLabel>
                      <Popover>
                        <PopoverTrigger 
                          render={
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal h-10",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          } 
                        />
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-primary">Security Deposit (Taken)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="0"
                            className="pl-9 font-bold text-primary" 
                            value={field.value === 0 ? "" : field.value}
                            onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardContent className="pt-6">
                <VehicleInspection 
                  vehicleType={selectedVehicle?.type || "Bike"}
                  onPhotosChange={(urls) => form.setValue("startInspectionPhotos", urls)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Vehicle Selection & Billing */}
          <div className="space-y-8">
            <Card className="border-primary/10 shadow-lg ring-1 ring-primary/5 overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Bike className="h-4 w-4" /> Select Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <Select 
                        value={field.value}
                        onValueChange={(val) => {
                          if (!val) return;
                          field.onChange(val);
                          const v = availableVehicles.find(v => v._id === val);
                          if (v) {
                            setSelectedVehicle(v);
                            form.setValue("startKm", v.lastKmReading);
                          }
                        }} 
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 font-bold text-lg">
                            <SelectValue placeholder="Pick an Available Bike" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableVehicles.map((v) => (
                            <SelectItem key={v._id} value={v._id} className="py-3">
                              <div className="flex flex-col">
                                <span className="font-bold">{v.model}</span>
                                <span className="text-[10px] uppercase font-mono text-muted-foreground">{v.plateNumber}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedVehicle && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-dashed">
                      <div className="text-xs font-bold text-muted-foreground uppercase">Daily Rate</div>
                      <div className="text-lg font-black text-primary">₹{selectedVehicle.baseRatePerDay}/day</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Estimated Total:</span>
                        <span className="font-bold italic">₹{form.watch("totalAmount") || 0}</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-1/3" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-black uppercase tracking-tighter gap-3 shadow-xl shadow-primary/20"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        Start Trip <ChevronRight size={20} />
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
                    By starting, you agree that the vehicle status will change to 'RENTED' live.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 p-4 rounded-xl flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
              <div className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                <strong>Pre-Check Reminder:</strong> Ensure the customer has a valid DL. Note any existing scratches on the body before handover.
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

function ChevronRight({ size, className }: { size?: number, className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>;
}
