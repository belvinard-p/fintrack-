import { api } from "@/services/http-client";
import { Category, CategoryCreate, CategoryUpdate } from "../types";

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories/");
  return response.data;
}

export async function createCategory(payload: CategoryCreate): Promise<Category> {
  const response = await api.post<Category>("/categories/", payload);
  return response.data;
}

export async function updateCategory(id: number, payload: CategoryUpdate): Promise<Category> {
  const response = await api.patch<Category>(`/categories/${id}`, payload);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}