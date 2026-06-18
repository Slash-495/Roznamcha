"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Purchase } from "@/lib/supabase";
import { addPurchase, updatePurchase } from "../actions";
import { addCustomer } from "@/app/(dashboard)/customers/actions";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase?: Purchase | null;
  customers: { id: string; name: string; phone: string }[];
}

interface ProductEntry {
  product_name: string;
  quantity: string;
  amount: string;
}

export function PurchaseFormModal({ open, onOpenChange, purchase, customers }: Props) {
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  
  const [products, setProducts] = useState<ProductEntry[]>([
    { product_name: "", quantity: "1", amount: "" },
  ]);

  useEffect(() => {
    if (purchase && open) {
      setCustomerId(purchase.customer_id);
      setPurchaseDate(purchase.purchase_date);
      setProducts([
        {
          product_name: purchase.product_name,
          quantity: purchase.quantity.toString(),
          amount: purchase.amount.toString(),
        },
      ]);
    } else if (!purchase && open) {
      if (customers.length === 1) {
        setCustomerId(customers[0].id);
        setCustomerSearch(`${customers[0].name} (${customers[0].phone})`);
      } else {
        setCustomerId("");
        setCustomerSearch("");
      }
      setNewCustomerPhone("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setProducts([{ product_name: "", quantity: "1", amount: "" }]);
    }
  }, [purchase, open, customers]);

  const handleProductChange = (index: number, field: keyof ProductEntry, value: string) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const addProductRow = () => {
    setProducts([...products, { product_name: "", quantity: "1", amount: "" }]);
  };

  const removeProductRow = (index: number) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  const grandTotal = products.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchase && !customerId) {
      if (!customerSearch) {
        alert("Please enter a customer name.");
        return;
      }
      if (!newCustomerPhone) {
        alert("Please enter a phone number for the new customer.");
        return;
      }
    }
    
    setLoading(true);
    try {
      if (purchase) {
        const p = products[0];
        const result = await updatePurchase(purchase.id, {
          product_name: p.product_name,
          quantity: parseInt(p.quantity),
          amount: parseFloat(p.amount),
          purchase_date: purchaseDate,
        });

        if (result && !result.success) alert("Error: " + result.error);
        else onOpenChange(false);
      } else {
        let finalCustomerId = customerId;
        
        if (!finalCustomerId) {
          const createResult = await addCustomer({ name: customerSearch, phone: newCustomerPhone, address: "" });
          if (!createResult.success || !createResult.id) {
            alert("Error creating new customer: " + createResult.error);
            setLoading(false);
            return;
          }
          finalCustomerId = createResult.id;
        }

        const payload = products.map((p) => ({
          customer_id: finalCustomerId,
          product_name: p.product_name,
          quantity: parseInt(p.quantity),
          amount: parseFloat(p.amount),
          purchase_date: purchaseDate,
        }));
        
        const result = await addPurchase(payload);

        if (result && !result.success) alert("Error: " + result.error);
        else onOpenChange(false);
      }
    } catch (error: any) {
      console.error(error);
      alert("An unexpected error occurred: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchase ? "Edit Purchase" : "Add Purchase"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            {!purchase && (
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="customer">Customer *</Label>
                <Input
                  list="customer-list"
                  id="customer"
                  required
                  placeholder="Type to search customer..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    const matched = customers.find(c => `${c.name} (${c.phone})` === e.target.value);
                    if (matched) {
                      setCustomerId(matched.id);
                      setNewCustomerPhone("");
                    } else {
                      setCustomerId("");
                    }
                  }}
                />
                <datalist id="customer-list">
                  {customers.map((c) => (
                    <option key={c.id} value={`${c.name} (${c.phone})`} />
                  ))}
                </datalist>
                
                {!customerId && customerSearch.length > 0 && (
                  <div className="mt-3 space-y-2 p-3 bg-blue-50/50 border border-blue-100 rounded-md">
                    <Label htmlFor="new_phone" className="text-blue-700 text-xs">Creating New Customer: Phone *</Label>
                    <Input
                      id="new_phone"
                      type="tel"
                      required
                      placeholder="Enter phone number"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="purchase_date">Date *</Label>
              <Input
                id="purchase_date"
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Products</Label>
            {products.map((p, index) => (
              <div key={index} className="flex gap-2 items-start border p-3 rounded-md bg-gray-50/50">
                <div className="grid grid-cols-12 gap-2 flex-1">
                  <div className="col-span-12 md:col-span-6 space-y-1">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      required
                      value={p.product_name}
                      onChange={(e) => handleProductChange(index, "product_name", e.target.value)}
                      placeholder="Product Name"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={p.quantity}
                      onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={p.amount}
                      onChange={(e) => handleProductChange(index, "amount", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {!purchase && products.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeProductRow(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {!purchase && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProductRow}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Another Product
            </Button>
          )}

          <div className="flex justify-end pt-2 border-t">
            <p className="text-sm font-medium">
              Grand Total: <span className="text-lg font-bold ml-2">₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
