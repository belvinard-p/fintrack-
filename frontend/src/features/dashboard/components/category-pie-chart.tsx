"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategorySpending } from "../types";
import { getCategoryColor } from "@/lib/category-color";

export function CategoryPieChart({ data }: Readonly<{ data: CategorySpending[] }>) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey={(entry) => Number.parseFloat(entry.total)}
          nameKey="category_name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(entry) => entry.name}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.category_id ?? `uncategorized-${index}`}
              fill={getCategoryColor(entry.category_id)}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
