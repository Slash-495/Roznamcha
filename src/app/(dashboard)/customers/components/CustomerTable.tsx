"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus, Search } from "lucide-react";
import { CustomerFormModal } from "./CustomerFormModal";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";

export function CustomerTable({ initialCustomers }: { initialCustomers: Customer[] }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pending" | "cleared">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setDeleteOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };
  
  const handleRowClick = (id: string) => {
    router.push(`/customers/${id}`);
  };

  const filteredCustomers = initialCustomers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    
    if (!matchesSearch) return false;

    if (filterType === "pending") return Number(c.pending_amount || 0) > 0;
    if (filterType === "cleared") return Number(c.pending_amount || 0) === 0;
    return true;
  });

  const getStatusBadge = (amount: number) => {
    if (amount > 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Pending</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Clear</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-white rounded-md border p-1">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded ${filterType === "all" ? "bg-gray-100 text-foreground" : "text-muted-foreground hover:bg-gray-50"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("pending")}
              className={`px-3 py-1.5 text-xs font-medium rounded ${filterType === "pending" ? "bg-red-50 text-red-700" : "text-muted-foreground hover:bg-gray-50"}`}
            >
              Pending Dues
            </button>
            <button
              onClick={() => setFilterType("cleared")}
              className={`px-3 py-1.5 text-xs font-medium rounded ${filterType === "cleared" ? "bg-green-50 text-green-700" : "text-muted-foreground hover:bg-gray-50"}`}
            >
              Cleared
            </button>
          </div>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        {initialCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new customer.
            </p>
            <div className="mt-6">
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No customers found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Pending Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Transaction</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(customer.id)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{Number(customer.pending_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(Number(customer.pending_amount || 0))}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {customer.last_transaction_date ? new Date(customer.last_transaction_date).toLocaleDateString() : "No transactions"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleEdit(e, customer)}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, customer)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
