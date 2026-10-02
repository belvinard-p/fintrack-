export type DebtType = "loan" | "credit_card" | "other";

export interface Debt {
  id: number;
  name: string;
  type: DebtType;
  principal: string;
  annual_rate: string | null;
  remaining_balance: string;
  created_at: string;
}

export interface DebtCreate {
  name: string;
  type?: DebtType;
  principal: string;
  annual_rate?: string | null;
}

export interface DebtUpdate {
  name?: string;
  type?: DebtType;
  principal?: string;
  annual_rate?: string | null;
}

export interface DebtPayment {
  id: number;
  debt_id: number;
  transaction_id: number;
  date: string;
  amount: string;
  principal_portion: string;
  interest_portion: string;
  created_at: string;
}

export interface DebtPaymentCreate {
  date: string;
  amount: string;
  account_id: number;
  description?: string;
}
