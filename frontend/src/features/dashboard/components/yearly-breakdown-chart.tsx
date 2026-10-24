"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/lib/i18n";
import type { MonthlyBreakdownItem } from "../types";
import { chartTheme } from "./chart-theme";

export function YearlyBreakdownChart({ data }: Readonly<{ data: MonthlyBreakdownItem[] }>) {
  const { t } = useLanguage();

  const chartData = data.map((item) => ({
    month: item.month.slice(5),
    income: Number.parseFloat(item.income),
    expenses: Number.parseFloat(item.expenses),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
        <XAxis dataKey="month" tick={chartTheme.tick} />
        <YAxis tick={chartTheme.tick} />
        <Tooltip {...chartTheme.tooltip} />
        <Legend />
        <Bar dataKey="income" name={t("dashboard.summary.income")} fill="#059669" />
        <Bar dataKey="expenses" name={t("dashboard.summary.expenses")} fill="#dc2626" />
      </BarChart>
    </ResponsiveContainer>
  );
}
