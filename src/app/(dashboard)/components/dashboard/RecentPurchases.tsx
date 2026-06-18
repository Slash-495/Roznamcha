import { Purchase } from "@/lib/supabase";

export function RecentPurchases({ purchases }: { purchases: Purchase[] }) {
  if (purchases.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed rounded-md mt-4">
        No recent purchases.
      </div>
    );
  }

  return (
    <div className="mt-4 divide-y border rounded-md overflow-hidden bg-white shadow-sm">
      {purchases.map((purchase) => (
        <div key={purchase.id} className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{purchase.customers?.name || "Unknown Customer"}</p>
            <p className="text-xs text-muted-foreground">{purchase.product_name} (Qty: {purchase.quantity})</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">₹{Number(purchase.amount).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{new Date(purchase.purchase_date).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
