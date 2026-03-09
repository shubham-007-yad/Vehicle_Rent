import { getShopSettings, getUsers } from "@/lib/actions";
import { ShopSettingsForm } from "@/components/settings/shop-settings-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  
  // Security: Only Owners can access settings
  if ((session?.user as any)?.role !== "Owner") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="bg-destructive/10 p-4 rounded-full">
          <ShieldAlert className="text-destructive h-12 w-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Only the Shop Owner can modify configuration.</p>
        </div>
      </div>
    );
  }

  const [{ settings, error: settingsError }, { users, error: usersError }] = await Promise.all([
    getShopSettings(),
    getUsers(),
  ]);

  if (settingsError || usersError) {
    return (
      <div className="p-8 text-center border rounded-xl bg-destructive/5">
        <p className="text-destructive font-bold">{settingsError || usersError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold italic tracking-tight">Shop Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Customize your shop identity, rental logic, and automation rules.
        </p>
      </div>

      <ShopSettingsForm initialSettings={settings} users={users} />
    </div>
  );
}
