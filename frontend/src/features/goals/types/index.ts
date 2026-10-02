export interface Goal {
  id: number;
  name: string;
  target_amount: string;
  opening_amount: string;
  current_amount: string;
  target_date: string | null;
  is_completed: boolean;
}

export interface GoalCreate {
  name: string;
  target_amount: string;
  opening_amount?: string;
  target_date?: string | null;
}

export interface GoalUpdate {
  name?: string;
  target_amount?: string;
  opening_amount?: string;
  target_date?: string | null;
}

export interface GoalContributionCreate {
  date: string;
  amount: string;
  account_id: number;
  description?: string;
}

export interface GoalContributionOut {
  id: number;
  goal_id: number;
  transaction_id: number;
  date: string;
  amount: string;
  created_at: string;
}

export interface GoalStatus {
  goal_id: number;
  name: string;
  monthly_allocation: string;
  monthly_contributed: string;
}
