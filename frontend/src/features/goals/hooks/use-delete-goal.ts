import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteGoal } from "../services/goals-api";

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
