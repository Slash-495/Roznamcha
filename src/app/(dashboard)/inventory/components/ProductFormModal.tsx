"use client";

import { useState } from "react";
import { Product } from "@/lib/supabase";
import { addProduct, updateProduct } from "../actions";
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function ProductFormModal({ isOpen, onClose, product }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    let result;
    if (product) {
      result = await updateProduct(product.id, formData);
    } else {
      result = await addProduct(formData);
    }

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input id="category" name="category" defaultValue={product?.category} placeholder="e.g. Electronics, Grocery" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" name="quantity" type="number" min="0" defaultValue={product?.quantity ?? 0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price (₹) *</Label>
              <Input id="unit_price" name="unit_price" type="number" min="0" step="0.01" defaultValue={product?.unit_price ?? 0} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimum_stock_threshold">Minimum Stock Threshold *</Label>
            <Input id="minimum_stock_threshold" name="minimum_stock_threshold" type="number" min="0" defaultValue={product?.minimum_stock_threshold ?? 5} required />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
