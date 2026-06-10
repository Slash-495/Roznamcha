"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Plus } from "lucide-react";
import { CustomerFormModal } from "../components/CustomerFormModal";
import { PurchaseFormModal } from "@/app/purchases/components/PurchaseFormModal";
import { Customer, Purchase } from "@/lib/supabase";

interface Props {
  customer: Customer;
  purchases: Purchase[];
}

export function CustomerDetailsClient({ customer, purchases }: Props) {
  const router = useRouter();
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [addPurchaseOpen, setAddPurchaseOpen] = useState(false);

  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const avgOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
  
  const customerList = [{ id: customer.id, name: customer.name, phone: customer.phone }];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/customers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
            <p className="text-muted-foreground">{customer.phone} {customer.address ? `• ${customer.address}` : ""}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setEditCustomerOpen(true)}>
            <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button onClick={() => setAddPurchaseOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Record Purchase
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-2">Total Orders</h3>
          <div className="text-2xl font-bold">{totalPurchases}</div>
        </div>
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-2">Total Spent</h3>
          <div className="text-2xl font-bold">₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-2">Avg. Order Value</h3>
          <div className="text-2xl font-bold">₹{avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50/50 px-6 py-4">
          <h3 className="font-semibold">Purchase History</h3>
        </div>
        {purchases.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No purchases recorded yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by recording a new purchase for {customer.name}.
            </p>
            <div className="mt-6">
              <Button onClick={() => setAddPurchaseOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Record Purchase
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium">{purchase.product_name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {purchase.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{Number(purchase.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-sm text-muted-foreground">{new Date(purchase.purchase_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomerFormModal
        open={editCustomerOpen}
        onOpenChange={setEditCustomerOpen}
        customer={customer}
      />
      <PurchaseFormModal
        open={addPurchaseOpen}
        onOpenChange={setAddPurchaseOpen}
        customers={customerList}
      />
    </div>
  );
}
