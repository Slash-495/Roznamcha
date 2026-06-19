"use client";

import { useActionState } from "react";
import { Merchant } from "@/lib/supabase";
import { updateMerchantProfile } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  merchant: Merchant;
}

const initialState: { success?: string; error?: string } = {};

export function SettingsForm({ merchant }: Props) {
  const [state, formAction, isPending] = useActionState(updateMerchantProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
          {state.success}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Shop Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shop_name">Shop Name *</Label>
            <Input id="shop_name" name="shop_name" defaultValue={merchant.shop_name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_category">Business Category</Label>
            <Input id="business_category" name="business_category" defaultValue={merchant.business_category || ""} placeholder="e.g. Grocery, Electronics, Clothing" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="shop_address">Shop Address</Label>
            <Input id="shop_address" name="shop_address" defaultValue={merchant.shop_address || ""} />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="font-semibold text-lg border-b pb-2">Owner Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="owner_name">Owner Name *</Label>
            <Input id="owner_name" name="owner_name" defaultValue={merchant.owner_name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input id="phone_number" name="phone_number" defaultValue={merchant.phone_number || ""} type="tel" />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
