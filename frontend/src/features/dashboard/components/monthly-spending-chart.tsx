"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MonthlySpending } from "../types";
import { chartTheme } from "./chart-theme";

export function MonthlySpendingChart({ data }: Readonly<{ data: MonthlySpending[] }>) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.map((d) => ({ ...d, total: Number.parseFloat(d.total) }))}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
        <XAxis dataKey="month" tick={chartTheme.tick} />
        <YAxis tick={chartTheme.tick} />
        <Tooltip {...chartTheme.tooltip} />
        <Bar dataKey="total" fill={chartTheme.bar} />
      </BarChart>
    </ResponsiveContainer>
  );
}
