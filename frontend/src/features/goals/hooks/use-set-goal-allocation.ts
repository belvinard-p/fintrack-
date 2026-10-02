import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setGoalAllocation } from "../services/goals-api";

export function useSetGoalAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, month, amount }: { goalId: number; month: string; amount: string }) =>
      setGoalAllocation(goalId, month, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
