export interface RecurringTransaction {
  id: number;
  description: string;
  amount: string;
  category_id: number | null;
  day_of_month: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  last_generated_month: string | null;
}

export interface RecurringTransactionCreate {
  description: string;
  amount: string;
  category_id?: number | null;
  day_of_month: number;
  start_date: string;
  end_date?: string | null;
}

export interface RecurringTransactionUpdate {
  description?: string;
  amount?: string;
  category_id?: number | null;
  day_of_month?: number;
  end_date?: string | null;
  is_active?: boolean;
}

export interface GenerateResult {
  created: number;
}
