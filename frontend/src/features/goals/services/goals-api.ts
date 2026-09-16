import { api } from "@/services/http-client";
import { Goal, GoalCreate, GoalUpdate, GoalContribution } from "../types";

export async function fetchGoals(): Promise<Goal[]> {
  const response = await api.get<Goal[]>("/goals/");
  return response.data;
}

export async function createGoal(payload: GoalCreate): Promise<Goal> {
  const response = await api.post<Goal>("/goals/", payload);
  return response.data;
}

export async function updateGoal(id: number, payload: GoalUpdate): Promise<Goal> {
  const response = await api.patch<Goal>(`/goals/${id}`, payload);
  return response.data;
}

export async function contributeToGoal(id: number, payload: GoalContribution): Promise<Goal> {
  const response = await api.post<Goal>(`/goals/${id}/contribute`, payload);
  return response.data;
}

export async function deleteGoal(id: number): Promise<void> {
  await api.delete(`/goals/${id}`);
}
