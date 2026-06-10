"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deletePurchase } from "../actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string;
}

export function DeletePurchaseDialog({ open, onOpenChange, purchaseId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deletePurchase(purchaseId);
      if (result && !result.success) {
        alert("Error: " + result.error);
      } else {
        onOpenChange(false);
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
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Delete Purchase</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this purchase? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
