import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGoal } from "../services/goals-api";
import { GoalUpdate } from "../types";

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GoalUpdate }) =>
      updateGoal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
