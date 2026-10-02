"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "../hooks/use-transactions";
import { useSourceLabel } from "../hooks/use-source-label";
import { TransactionCardList } from "./transaction-card-list";
import { TransactionTable } from "./transaction-table";
import { TransactionMonthPicker } from "./transaction-month-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";
import { getCurrentMonth, getMonthDateRange } from "@/lib/date";

const PAGE_SIZE = 20;

export function TransactionList() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(getCurrentMonth);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const sourceLabel = useSourceLabel();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  function handleMonthChange(next: string) {
    setMonth(next);
    setPage(1);
  }

  const { data, isLoading, error } = useTransactions({
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    ...getMonthDateRange(month),
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <TransactionMonthPicker month={month} onChange={handleMonthChange} />
        <Input
          placeholder={t("transactions.list.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div aria-live="polite">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {error && <p className="text-red-600">{t("transactions.list.failedToLoad")}</p>}
        {data?.items.length === 0 && (
          <p className="text-muted-foreground">{t("transactions.list.empty")}</p>
        )}
      </div>

      {data && data.items.length > 0 && (
        <>
          <TransactionCardList transactions={data.items} sourceLabel={sourceLabel} />
          <TransactionTable transactions={data.items} sourceLabel={sourceLabel} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t("transactions.list.page", {
                page: data.page,
                totalPages: data.total_pages,
                total: data.total,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("transactions.list.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("transactions.list.next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
