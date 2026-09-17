import { cn } from "cn";
import { getCategoryColor } from "@/lib/category-color";

export function CategoryDot({
  categoryId,
  className,
}: Readonly<{ categoryId: number | null | undefined; className?: string }>) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: getCategoryColor(categoryId) }}
    />
  );
}
