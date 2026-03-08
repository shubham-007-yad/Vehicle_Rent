"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  User, 
  Mail, 
  Save, 
  Loader2,
  Shield,
  CheckCircle2,
  Camera,
  Smartphone,
  TextQuote,
  Image as ImageIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { updateUserProfile, uploadFile, changePassword } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().length(10, "Must be a 10-digit number").optional().or(z.literal("")),
  bio: z.string().max(160, "Bio must be under 160 characters").optional(),
  profilePictureUrl: z.string().optional(),
  profileBannerUrl: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function EditProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const { update } = useSession();
  const dpInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [isPending, setIsPending] = useState(false);
  const [isPassPending, setIsPassPending] = useState(false);
  const [isDpUploading, setIsDpUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  
  const [dpPreview, setDpPreview] = useState(user.profilePictureUrl || "");
  const [bannerPreview, setBannerPreview] = useState(user.profileBannerUrl || "");

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      bio: user.bio || "",
      profilePictureUrl: user.profilePictureUrl || "",
      profileBannerUrl: user.profileBannerUrl || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleDpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max 5MB allowed.");
      return;
    }

    setIsDpUploading(true);
    try {
      const result = await uploadFile(file, "profile_pictures");
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        setDpPreview(result.url);
        form.setValue("profilePictureUrl", result.url, { 
          shouldDirty: true, 
          shouldTouch: true 
        });
        toast.success("Profile picture updated!");
      }
    } catch (err) {
      toast.error("Error uploading profile picture.");
    } finally {
      setIsDpUploading(false);
      if (dpInputRef.current) dpInputRef.current.value = "";
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max 5MB allowed.");
      return;
    }

    setIsBannerUploading(true);
    try {
      const result = await uploadFile(file, "profile_banners");
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        setBannerPreview(result.url);
        form.setValue("profileBannerUrl", result.url, { 
          shouldDirty: true, 
          shouldTouch: true 
        });
        toast.success("Profile banner updated!");
      }
    } catch (err) {
      toast.error("Error uploading banner.");
    } finally {
      setIsBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsPending(true);
    const result = await updateUserProfile(values);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      // Trigger session update so header DP syncs
      await update({
        ...values,
        image: values.profilePictureUrl
      });
      
      toast.success("Profile updated successfully!");
      router.refresh();
    }
    setIsPending(false);
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    setIsPassPending(true);
    const result = await changePassword(values);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Password changed successfully!");
      passwordForm.reset();
    }
    setIsPassPending(false);
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 px-1 md:px-0">
      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md h-12 p-1 bg-muted/50 rounded-xl mb-6">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow">
            <User size={16} /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow">
            <Shield size={16} /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 outline-none">
          <Card className="border-primary/10 overflow-hidden shadow-lg mx-1 md:mx-0">
            {/* Banner Section */}
            <div className="h-32 md:h-48 bg-muted relative group">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/5 flex items-center justify-center text-muted-foreground/30">
                  <ImageIcon size={48} strokeWidth={1} />
                </div>
              )}
              
              {isBannerUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" />
                </div>
              )}

              <button 
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-md border hover:bg-background p-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold transition-all active:scale-95"
              >
                <Camera size={14} className="text-primary" />
                <span className="hidden md:inline">Change Banner</span>
              </button>
              
              <input 
                type="file" 
                ref={bannerInputRef} 
                onChange={handleBannerChange} 
                accept="image/*" 
                className="hidden" 
              />

              {/* Profile Picture (DP) Section */}
              <div className="absolute -bottom-12 md:-bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="relative">
                  <div className="bg-background p-1 rounded-full border-4 border-primary/20 shadow-xl overflow-hidden size-24 md:size-32">
                    {dpPreview ? (
                      <img src={dpPreview} alt="DP" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center rounded-full text-muted-foreground">
                        <User size={48} />
                      </div>
                    )}
                    {isDpUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                        <Loader2 className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => dpInputRef.current?.click()}
                    className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-background"
                  >
                    <Camera size={16} />
                  </button>
                  <input 
                    type="file" 
                    ref={dpInputRef} 
                    onChange={handleDpChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
            </div>
            
            <CardHeader className="pt-16 md:pt-20 text-center">
              <CardTitle className="text-xl md:text-2xl font-bold">Edit Profile</CardTitle>
              <CardDescription className="text-xs md:text-sm">Personalize your shop identity.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-2 md:pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Hidden fields to capture uploaded URLs */}
                  <input type="hidden" {...form.register("profilePictureUrl")} />
                  <input type="hidden" {...form.register("profileBannerUrl")} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User size={12} /> Full Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your name" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Mail size={12} /> Email Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="name@example.com" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Smartphone size={12} /> Phone Number
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">+91</span>
                              <Input className="pl-12 font-mono h-11" placeholder="9876543210" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-3 rounded-lg bg-muted/30 border border-muted flex items-center justify-between h-11 mt-auto">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                        <Shield size={10} /> Access Level: <span className="text-primary font-bold">{(user as any).role || "Staff"}</span>
                      </div>
                      <CheckCircle2 size={14} className="text-primary" />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <TextQuote size={12} /> Professional Bio
                        </FormLabel>
                        <FormControl>
                          <textarea 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Tell customers about your experience..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 gap-2 text-lg font-bold shadow-lg shadow-primary/20"
                    disabled={isPending || isDpUploading || isBannerUploading}
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Save size={20} /> Save Profile Changes
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 outline-none">
          <Card className="border-primary/10 shadow-lg mx-1 md:mx-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Account Security
              </CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-11" />
                        </FormControl>
                        <FormDescription className="text-[10px]">Min 6 characters. Use a unique password.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 gap-2 font-bold mt-4"
                    disabled={isPassPending}
                  >
                    {isPassPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
