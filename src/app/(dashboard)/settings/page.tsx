import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SettingsForm } from "./components/SettingsForm";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch merchant profile
  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !merchant) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load merchant profile. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your shop profile and account settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Account Overview Card (Read Only) */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Account Overview</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Shop Name</p>
                <p className="font-medium text-foreground">{merchant.shop_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Owner Name</p>
                <p className="font-medium text-foreground">{merchant.owner_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email Address</p>
                <p className="font-medium text-foreground">{merchant.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Member Since</p>
                <p className="font-medium text-foreground">{format(new Date(merchant.created_at), "PPP")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white shadow-sm p-6">
            <SettingsForm merchant={merchant} />
          </div>
        </div>
      </div>
    </div>
  );
}
