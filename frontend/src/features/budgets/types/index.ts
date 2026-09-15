export interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  monthly_limit: string;
  month: string;
}

export interface BudgetCreate {
  category_id: number;
  monthly_limit: string;
  month: string;
}

export interface BudgetUpdate {
  category_id?: number;
  monthly_limit?: string;
  month?: string;
}

export interface BudgetStatus {
  id: number;
  category_id: number;
  category_name: string;
  monthly_limit: string;
  actual_spending: string;
  is_over_budget: boolean;
}