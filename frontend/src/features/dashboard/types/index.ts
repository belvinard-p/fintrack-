export interface CategorySpending {
  category_id: number | null;
  category_name: string;
  total: string;
}

export interface MonthlySpending {
  month: string;
  total: string;
}
