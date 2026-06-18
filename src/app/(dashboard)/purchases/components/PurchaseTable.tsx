"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Purchase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus } from "lucide-react";
import { PurchaseFormModal } from "./PurchaseFormModal";
import { DeletePurchaseDialog } from "./DeletePurchaseDialog";

interface Props {
  initialPurchases: Purchase[];
  customers: { id: string; name: string; phone: string }[];
  currentFilter: string;
}

export function PurchaseTable({ initialPurchases, customers, currentFilter }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const handleEdit = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setFormOpen(true);
  };

  const handleDelete = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPurchase(null);
    setFormOpen(true);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/purchases?filter=${e.target.value}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <label htmlFor="filter" className="text-sm font-medium text-muted-foreground">Filter:</label>
          <select
            id="filter"
            value={currentFilter}
            onChange={handleFilterChange}
            className="flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">All Time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Purchase
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        {initialPurchases.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No purchases found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentFilter === "all" ? "Get started by recording a new customer purchase." : "Try changing the filter or adding a new purchase."}
            </p>
            <div className="mt-6">
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" /> Add Purchase
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {purchase.customers?.name || "Unknown"}
                  </TableCell>
                  <TableCell>{purchase.product_name}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>₹{Number(purchase.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(purchase.purchase_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(purchase)}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(purchase)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <PurchaseFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        purchase={selectedPurchase}
        customers={customers}
      />

      {selectedPurchase && (
        <DeletePurchaseDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          purchaseId={selectedPurchase.id}
        />
      )}
    </div>
  );
}
