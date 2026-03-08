"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Save, 
  Loader2, 
  Store, 
  Calculator, 
  Wrench, 
  Plus, 
  Trash2, 
  Smartphone,
  MapPin,
  BadgeCent,
  FileText,
  Users as UsersIcon,
  UserPlus,
  Mail,
  Lock,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { updateShopSettings, createStaffUser, deleteUser } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const damageItemSchema = z.object({
  name: z.string().min(1, "Damage name is required"),
  price: z.number().min(0, "Invalid price"),
});

const formSchema = z.object({
  shopName: z.string().min(2, "Shop Name is required"),
  ownerPhone: z.string().length(10, "Must be a 10-digit number"),
  address: z.string().min(5, "Address is required"),
  gstNumber: z.string().optional(),
  defaultDepositScooter: z.number().min(0),
  defaultDepositBike: z.number().min(0),
  defaultDepositCar: z.number().min(0),
  lateFeePerHour: z.number().min(0),
  whatsappNotification: z.boolean(),
  currencySymbol: z.string().min(1),
  damageCatalog: z.array(damageItemSchema),
});

const staffFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  role: z.enum(["Staff", "Owner"]),
});

export function ShopSettingsForm({ initialSettings, users }: { initialSettings: any, users: any[] }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isStaffPending, setIsStaffPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shopName: initialSettings?.shopName || "Varanasi Rentals",
      ownerPhone: initialSettings?.ownerPhone || "9876543210",
      address: initialSettings?.address || "Assi Ghat, Varanasi",
      gstNumber: initialSettings?.gstNumber || "",
      defaultDepositScooter: initialSettings?.defaultDepositScooter || 1000,
      defaultDepositBike: initialSettings?.defaultDepositBike || 2000,
      defaultDepositCar: initialSettings?.defaultDepositCar || 5000,
      lateFeePerHour: initialSettings?.lateFeePerHour || 100,
      whatsappNotification: initialSettings?.whatsappNotification ?? true,
      currencySymbol: initialSettings?.currencySymbol || "₹",
      damageCatalog: initialSettings?.damageCatalog || [],
    },
  });

  const staffForm = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "Staff",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "damageCatalog",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    const result = await updateShopSettings(values);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings updated successfully!");
      router.refresh();
    }
    setIsPending(false);
  }

  async function onStaffSubmit(values: z.infer<typeof staffFormSchema>) {
    setIsStaffPending(true);
    const result = await createStaffUser(values);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Staff member added!");
      setIsAddStaffOpen(false);
      staffForm.reset();
      router.refresh();
    }
    setIsStaffPending(false);
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Are you sure? This staff member will lose access immediately.")) return;
    const result = await deleteUser(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User deleted successfully.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 px-1 md:px-0">
      <Tabs defaultValue="profile" className="w-full">
        <div className="overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          <TabsList className="flex w-fit md:grid md:grid-cols-4 md:w-full max-w-xl h-12 p-1 bg-muted/50 rounded-xl mb-2 md:mb-6">
            <TabsTrigger value="profile" className="rounded-lg gap-2 whitespace-nowrap px-4 md:px-2 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow">
              <Store size={14} /> Profile
            </TabsTrigger>
            <TabsTrigger value="rules" className="rounded-lg gap-2 whitespace-nowrap px-4 md:px-2 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow">
              <Calculator size={14} /> Rules
            </TabsTrigger>
            <TabsTrigger value="damages" className="rounded-lg gap-2 whitespace-nowrap px-4 md:px-2 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow">
              <Wrench size={14} /> Damages
            </TabsTrigger>
            <TabsTrigger value="staff" className="rounded-lg gap-2 whitespace-nowrap px-4 md:px-2 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow">
              <UsersIcon size={14} /> Staff
            </TabsTrigger>
          </TabsList>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="profile" className="space-y-4 md:space-y-6">
              <Card className="border-primary/10 shadow-sm">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Store className="h-5 w-5 text-primary" /> Shop Identity
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">This information will appear on bills and invoices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <FormField
                      control={form.control}
                      name="shopName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Shop Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Assi Ghat Bike Point" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ownerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Owner WhatsApp Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 font-mono h-10" placeholder="9876543210" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Business Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <textarea 
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Plot 12, Assi Ghat Road, Varanasi, UP - 221005" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsappNotification"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 md:p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs md:text-sm">WhatsApp Billing</FormLabel>
                          <FormDescription className="text-[10px] md:text-xs leading-tight">Send bills automatically via WhatsApp.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4 md:space-y-6">
              <Card className="border-primary/10 shadow-sm">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Calculator className="h-5 w-5 text-primary" /> Rental Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="defaultDepositScooter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Scooter Deposit</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-10" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defaultDepositBike"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Bike Deposit</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-10" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lateFeePerHour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Late Fee (per hr)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="h-10" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="damages" className="space-y-4 md:space-y-6">
              <Card className="border-primary/10 shadow-sm">
                <CardHeader className="flex justify-between flex-row items-center p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">Damage Catalog</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", price: 0 })} className="h-8 text-xs">
                    <Plus size={14} className="mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 md:gap-4 items-end bg-muted/20 p-2 rounded-lg border border-dashed md:bg-transparent md:p-0 md:border-0 md:rounded-none">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground md:hidden">Name</Label>
                        <Input {...form.register(`damageCatalog.${index}.name`)} placeholder="Item Name" className="h-9 text-xs md:text-sm md:h-10" />
                      </div>
                      <div className="w-20 md:w-32 space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground md:hidden">Price</Label>
                        <Input type="number" {...form.register(`damageCatalog.${index}.price`, { valueAsNumber: true })} placeholder="Price" className="h-9 text-xs md:text-sm md:h-10" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-9 w-9 text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end pt-2 sticky bottom-20 md:relative md:bottom-0">
              <Button type="submit" disabled={isPending} className="w-full md:w-auto h-12 md:h-10 shadow-lg md:shadow-none">
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} 
                Save Changes
              </Button>
            </div>
          </form>
        </Form>

        <TabsContent value="staff" className="space-y-4 md:space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="flex justify-between flex-row items-center p-4 md:p-6">
              <div className="space-y-1">
                <CardTitle className="text-lg md:text-xl">Staff Management</CardTitle>
                <CardDescription className="text-xs">Control dashboard access.</CardDescription>
              </div>
              <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                <DialogTrigger render={<Button size="sm" className="h-8 text-xs px-2"><UserPlus size={14} className="mr-1" /> Add Staff</Button>} />
                <DialogContent className="max-w-[90vw] md:max-w-md rounded-xl">
                  <DialogHeader><DialogTitle className="text-left">Add Staff</DialogTitle></DialogHeader>
                  <Form {...staffForm}>
                    <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-4 pt-4">
                      <FormField control={staffForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} className="h-10" /></FormControl></FormItem>
                      )} />
                      <FormField control={staffForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Email</FormLabel><FormControl><Input placeholder="john@example.com" {...field} className="h-10" /></FormControl></FormItem>
                      )} />
                      <FormField control={staffForm.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} className="h-10" /></FormControl></FormItem>
                      )} />
                      <Button type="submit" className="w-full h-11" disabled={isStaffPending}>
                        {isStaffPending ? "Creating..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6 pt-0 md:pt-0">
              <div className="grid gap-3">
                {users.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="bg-background p-2 rounded-full border shadow-sm"><UserCheck size={16} className="text-primary" /></div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                        <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-1.5 py-0.5 rounded leading-none">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    {user.role !== "Owner" && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user._id)} className="h-8 w-8 text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
