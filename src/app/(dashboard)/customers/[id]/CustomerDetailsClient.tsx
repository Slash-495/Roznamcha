"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { CustomerFormModal } from "../components/CustomerFormModal";
import { PurchaseFormModal } from "@/app/(dashboard)/purchases/components/PurchaseFormModal";
import { AddCreditModal, RecoverPaymentModal } from "./components/KhataModals";
import { Customer, Purchase, KhataTransaction } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, subMonths, subYears, isAfter } from "date-fns";

interface Props {
  customer: Customer;
  purchases: Purchase[];
  khataTransactions: KhataTransaction[];
}

export function CustomerDetailsClient({ customer, purchases, khataTransactions }: Props) {
  const router = useRouter();
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [addPurchaseOpen, setAddPurchaseOpen] = useState(false);
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const [recoverPaymentOpen, setRecoverPaymentOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");

  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const pendingAmount = Number(customer.pending_amount || 0);
  const totalCreditGiven = khataTransactions
    .filter(t => t.transaction_type === "credit")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRecovered = khataTransactions
    .filter(t => t.transaction_type === "recovery")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const customerList = [{ id: customer.id, name: customer.name, phone: customer.phone }];

  const filterByTime = (dateString: string) => {
    if (timeFilter === "all") return true;
    const date = new Date(dateString);
    const now = new Date();
    if (timeFilter === "week") return isAfter(date, subDays(now, 7));
    if (timeFilter === "month") return isAfter(date, subMonths(now, 1));
    if (timeFilter === "year") return isAfter(date, subYears(now, 1));
    return true;
  };

  const filteredPurchases = useMemo(() => purchases.filter(p => filterByTime(p.purchase_date)), [purchases, timeFilter]);
  const filteredKhata = useMemo(() => khataTransactions.filter(t => filterByTime(t.created_at)), [khataTransactions, timeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/customers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
            <p className="text-muted-foreground">{customer.phone} {customer.address ? `• ${customer.address}` : ""}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditCustomerOpen(true)}>
            <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button variant="outline" onClick={() => setAddPurchaseOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Record Purchase
          </Button>
          <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={() => setAddCreditOpen(true)}>
            <ArrowUpCircle className="mr-2 h-4 w-4" /> Add Credit
          </Button>
          <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => setRecoverPaymentOpen(true)} disabled={pendingAmount <= 0}>
            <ArrowDownCircle className="mr-2 h-4 w-4" /> Recover Payment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-2">Pending Amount</h3>
          <div className="text-2xl font-bold text-red-600">₹{pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-2">Total Credit Given</h3>
          <div className="text-2xl font-bold">₹{totalCreditGiven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-2">Total Recovered</h3>
          <div className="text-2xl font-bold text-green-600">₹{totalRecovered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground mb-2">Total Purchases Value</h3>
          <div className="text-2xl font-bold">₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
        <div className="w-[180px]">
          <Select value={timeFilter} onValueChange={(val) => setTimeFilter(val || "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Select Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Past 7 Days</SelectItem>
              <SelectItem value="month">Past 30 Days</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khata History */}
        <div className="rounded-md border bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="border-b bg-gray-50/50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold">Khata (Credit) History</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {filteredKhata.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No credit history for the selected period.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredKhata.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((tx) => (
                  <div key={tx.id} className="p-4 sm:p-6 flex items-start justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 p-2 rounded-full ${tx.transaction_type === 'credit' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {tx.transaction_type === 'credit' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{tx.transaction_type === 'credit' ? 'Credit Added' : 'Payment Recovered'}</p>
                        <p className="text-sm text-muted-foreground">{tx.note || "No note provided"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.transaction_type === 'credit' ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.transaction_type === 'credit' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Purchase History */}
        <div className="rounded-md border bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="border-b bg-gray-50/50 px-6 py-4">
            <h3 className="font-semibold">Purchase History</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {filteredPurchases.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No purchases recorded for the selected period.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredPurchases.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((purchase) => (
                  <div key={purchase.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
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
        </div>
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
      <AddCreditModal
        customerId={customer.id}
        isOpen={addCreditOpen}
        onClose={() => setAddCreditOpen(false)}
      />
      <RecoverPaymentModal
        customerId={customer.id}
        isOpen={recoverPaymentOpen}
        onClose={() => setRecoverPaymentOpen(false)}
        maxRecovery={pendingAmount}
      />
    </div>
  );
}
