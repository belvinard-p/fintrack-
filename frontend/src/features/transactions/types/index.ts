export interface Transaction {
  id: number;
  user_id: number;
  date: string;
  description: string;
  amount: string;
  category_id: number | null;
  source: "manual" | "csv_import";
  created_at: string;
}

export interface TransactionCreate {
  date: string;
  description: string;
  amount: string;
  category_id?: number | null;
}
