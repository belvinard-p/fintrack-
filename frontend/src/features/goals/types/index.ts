export interface Goal {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date: string | null;
  is_completed: boolean;
}

export interface GoalCreate {
  name: string;
  target_amount: string;
  target_date?: string | null;
}

export interface GoalUpdate {
  name?: string;
  target_amount?: string;
  target_date?: string | null;
}

export interface GoalContribution {
  amount: string;
}
