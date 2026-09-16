import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateDueTransactions } from "../services/recurring-transactions-api";

/**
 * Fires once per mount to materialize any due recurring transactions,
 * so users never have to remember to do it themselves.
 */
export function useAutoGenerateRecurring() {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  const generate = useMutation({
    mutationFn: generateDueTransactions,
    onSuccess: (result) => {
      if (result.created > 0) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
      }
    },
  });

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    generate.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
