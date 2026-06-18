"use client";

import { useState } from "react";
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
import { addKhataCredit, recoverKhataPayment } from "../actions";

interface ModalProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  maxRecovery?: number; // Only used for recovery modal
}

export function AddCreditModal({ customerId, isOpen, onClose }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await addKhataCredit(customerId, formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Credit (Khata)</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input id="amount" name="amount" type="number" min="1" step="0.01" required placeholder="e.g. 500" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note / Reason</Label>
            <Input id="note" name="note" placeholder="e.g. Bought items on credit" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Credit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecoverPaymentModal({ customerId, isOpen, onClose, maxRecovery = 0 }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount")?.toString() || "0");
    
    if (amount > maxRecovery) {
      setError(`Cannot recover more than the pending amount (₹${maxRecovery}).`);
      setLoading(false);
      return;
    }

    const result = await recoverKhataPayment(customerId, formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Recover Payment</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Received (₹) *</Label>
            <Input id="amount" name="amount" type="number" min="1" max={maxRecovery} step="0.01" required placeholder={`Max: ₹${maxRecovery}`} />
            <p className="text-xs text-muted-foreground">Pending Amount: ₹{maxRecovery}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input id="note" name="note" placeholder="e.g. Partial payment received" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Processing..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
