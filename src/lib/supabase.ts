import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type Merchant = {
  id: string;
  shop_name: string;
  owner_name: string;
  email: string;
  phone_number?: string | null;
  shop_address?: string | null;
  business_category?: string | null;
  created_at: string;
};

export type Customer = {
  id: string;
  merchant_id: string;
  name: string;
  phone: string;
  address: string | null;
  pending_amount: number;
  last_transaction_date: string | null;
  created_at: string;
};

export type Purchase = {
  id: string;
  merchant_id: string;
  customer_id: string;
  product_name: string;
  quantity: number;
  amount: number;
  purchase_date: string;
  created_at: string;
  customers?: { name: string; phone: string };
};

export type Product = {
  id: string;
  merchant_id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  minimum_stock_threshold: number;
  created_at: string;
  updated_at: string;
};

export type KhataTransaction = {
  id: string;
  merchant_id: string;
  customer_id: string;
  transaction_type: "credit" | "recovery";
  amount: number;
  note: string | null;
  created_at: string;
};
