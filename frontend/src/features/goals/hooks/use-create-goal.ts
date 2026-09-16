import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGoal } from "../services/goals-api";

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
