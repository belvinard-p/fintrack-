import { api } from "@/services/http-client";
import { Category } from "../types";

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories/");
  return response.data;
}