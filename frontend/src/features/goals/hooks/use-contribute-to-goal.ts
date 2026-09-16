import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contributeToGoal } from "../services/goals-api";
import { GoalContribution } from "../types";

export function useContributeToGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: GoalContribution }) =>
      contributeToGoal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
