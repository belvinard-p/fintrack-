import { useQuery } from "@tanstack/react-query";
import { fetchDebts } from "../services/debts-api";

export function useDebts() {
  return useQuery({
    queryKey: ["debts"],
    queryFn: fetchDebts,
  });
}
