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

export interface TransactionUpdate {
  date?: string;
  description?: string;
  amount?: string;
  category_id?: number | null;
}

export interface InvalidRowDetail {
  row_number: number;
  reason: string;
}

export interface ImportResult {
  created: number;
  skipped_duplicates: number;
  invalid_rows: number;
  invalid_row_details: InvalidRowDetail[];
  total_rows: number;
}

export interface TransactionListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}