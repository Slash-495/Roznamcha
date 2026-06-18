import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type Merchant = {
  id: string;
  shop_name: string;
  owner_name: string;
  email: string;
  created_at: string;
};

export type Customer = {
  id: string;
  merchant_id: string;
  name: string;
  phone: string;
  address: string | null;
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
