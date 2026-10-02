import { useEffect, useRef } from "react";
import { useGenerateDueTransactions } from "./use-generate-due-transactions";

/**
 * Fires once per mount to materialize any due recurring transactions,
 * so users never have to remember to do it themselves.
 */
export function useAutoGenerateRecurring() {
  const hasRun = useRef(false);
  const generate = useGenerateDueTransactions();

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    generate.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
