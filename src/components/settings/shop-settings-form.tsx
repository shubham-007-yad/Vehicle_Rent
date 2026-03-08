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
    <div className="space-y-8">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-xl h-12 p-1 bg-muted/50 rounded-xl mb-6">
          <TabsTrigger value="profile" className="rounded-lg gap-2">
            <Store size={16} /> Profile
          </TabsTrigger>
          <TabsTrigger value="rules" className="rounded-lg gap-2">
            <Calculator size={16} /> Rules
          </TabsTrigger>
          <TabsTrigger value="damages" className="rounded-lg gap-2">
            <Wrench size={16} /> Damages
          </TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg gap-2">
            <UsersIcon size={16} /> Staff
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" /> Shop Identity
                  </CardTitle>
                  <CardDescription>This information will appear on bills and invoices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="shopName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Assi Ghat Bike Point" {...field} />
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
                          <FormLabel>Owner WhatsApp Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9 font-mono" placeholder="9876543210" {...field} />
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
                        <FormLabel>Business Address</FormLabel>
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
                      <FormItem className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-0.5">
                          <FormLabel>Automated WhatsApp Billing</FormLabel>
                          <FormDescription>Send bills automatically when trips start/end.</FormDescription>
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

            <TabsContent value="rules" className="space-y-6">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" /> Rental Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="defaultDepositScooter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scooter Deposit</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defaultDepositBike"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bike Deposit</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lateFeePerHour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Late Fee (per hr)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="damages" className="space-y-6">
              <Card className="border-primary/10">
                <CardHeader className="flex justify-between flex-row items-center">
                  <CardTitle>Damage Catalog</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", price: 0 })}>
                    <Plus size={14} className="mr-2" /> Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Input {...form.register(`damageCatalog.${index}.name`)} placeholder="Item Name" />
                      </div>
                      <div className="w-32">
                        <Input type="number" {...form.register(`damageCatalog.${index}.price`, { valueAsNumber: true })} placeholder="Price" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 size={18} className="text-red-500" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} 
                Save Configuration
              </Button>
            </div>
          </form>
        </Form>

        <TabsContent value="staff" className="space-y-6">
          <Card className="border-primary/10">
            <CardHeader className="flex justify-between flex-row items-center">
              <div>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>Control dashboard access.</CardDescription>
              </div>
              <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                <DialogTrigger render={<Button size="sm"><UserPlus size={14} className="mr-2" /> Add Staff</Button>} />
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Staff</DialogTitle></DialogHeader>
                  <Form {...staffForm}>
                    <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-4">
                      <FormField control={staffForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={staffForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={staffForm.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl></FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={isStaffPending}>
                        {isStaffPending ? "Creating..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {users.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-full"><UserCheck size={18} /></div>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email} • {user.role}</p>
                      </div>
                    </div>
                    {user.role !== "Owner" && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user._id)}>
                        <Trash2 size={18} className="text-red-500" />
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
