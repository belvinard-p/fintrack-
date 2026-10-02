export type AccountType = "checking" | "savings" | "cash" | "other";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  opening_balance: string;
  balance: string;
  created_at: string;
}

export interface AccountCreate {
  name: string;
  type?: AccountType;
  opening_balance?: string;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  opening_balance?: string;
}
