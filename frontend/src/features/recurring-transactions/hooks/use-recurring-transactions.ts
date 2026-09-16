import { useQuery } from "@tanstack/react-query";
import { fetchRecurringTransactions } from "../services/recurring-transactions-api";

export function useRecurringTransactions() {
  return useQuery({
    queryKey: ["recurring-transactions"],
    queryFn: fetchRecurringTransactions,
  });
}
