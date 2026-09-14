import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "../services/transactions-api";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });
}
