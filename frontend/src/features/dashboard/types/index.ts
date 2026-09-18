export interface CategorySpending {
  category_id: number | null;
  category_name: string;
  total: string;
}

export interface MonthlySpending {
  month: string;
  total: string;
}


export interface PeriodTotals {
  total_income: string;
  total_expenses: string;
  net: string;
}

export interface MonthlySummary {
  month: string;
  total_income: string;
  total_expenses: string;
  net: string;
  savings_rate: string | null;
  transaction_count: number;
  previous: PeriodTotals;
  expenses_by_category: CategorySpending[];
}
