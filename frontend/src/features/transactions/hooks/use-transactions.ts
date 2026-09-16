import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "../services/transactions-api";
import { TransactionListParams } from "../types";

export function useTransactions(params: TransactionListParams = {}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => fetchTransactions(params),
    placeholderData: (previousData) => previousData,
  });
}
