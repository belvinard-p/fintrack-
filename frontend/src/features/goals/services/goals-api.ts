import { api } from "@/services/http-client";
import {
  Goal,
  GoalCreate,
  GoalUpdate,
  GoalContributionCreate,
  GoalContributionOut,
  GoalStatus,
} from "../types";

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

export async function contributeToGoal(id: number, payload: GoalContributionCreate): Promise<Goal> {
  const response = await api.post<Goal>(`/goals/${id}/contribute`, payload);
  return response.data;
}

export async function deleteGoal(id: number): Promise<void> {
  await api.delete(`/goals/${id}`);
}

export async function fetchGoalContributions(goalId: number): Promise<GoalContributionOut[]> {
  const response = await api.get<GoalContributionOut[]>(`/goals/${goalId}/contributions`);
  return response.data;
}

export async function fetchGoalStatus(month: string): Promise<GoalStatus[]> {
  const response = await api.get<GoalStatus[]>("/goals/status", { params: { month } });
  return response.data;
}

export async function setGoalAllocation(
  goalId: number,
  month: string,
  amount: string
): Promise<GoalStatus> {
  const response = await api.put<GoalStatus>(`/goals/${goalId}/allocations/${month}`, { amount });
  return response.data;
}
