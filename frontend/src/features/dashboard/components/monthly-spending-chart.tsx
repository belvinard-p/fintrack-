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

export function MonthlySpendingChart({ data }: Readonly<{ data: MonthlySpending[] }>) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.map((d) => ({ ...d, total: Number.parseFloat(d.total) }))}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" fill="#0f172a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
