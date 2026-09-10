"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CategorySpending } from "../types";

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#f97316", "#fb923c", "#fdba74"];

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
            <Cell key={entry.category_name ?? `uncategorized-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
