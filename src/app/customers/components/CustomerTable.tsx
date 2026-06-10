"use client";

import { useState } from "react";
import { Customer } from "@/lib/supabase";
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
import { CustomerFormModal } from "./CustomerFormModal";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";

export function CustomerTable({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        {initialCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a new customer to your database.
            </p>
            <div className="mt-6">
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.address || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(customer)}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(customer)}
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

      <CustomerFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={selectedCustomer}
      />

      {selectedCustomer && (
        <DeleteCustomerDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          customerId={selectedCustomer.id}
        />
      )}
    </div>
  );
}
