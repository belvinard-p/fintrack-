import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../services/categories-api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}