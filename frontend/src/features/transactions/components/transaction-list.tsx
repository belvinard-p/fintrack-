"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTransactions } from "../hooks/use-transactions";
import { useDeleteTransaction } from "../hooks/use-delete-transaction";
import { useSourceLabel } from "../hooks/use-source-label";
import { TransactionCardList } from "./transaction-card-list";
import { TransactionTable } from "./transaction-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

const PAGE_SIZE = 20;

export function TransactionList() {
  const { t } = useLanguage();
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

  const { data, isLoading, error } = useTransactions({
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
  });
  const deleteTransaction = useDeleteTransaction();

  function handleDelete(id: number) {
    deleteTransaction.mutate(id, {
      onSuccess: () => toast.success(t("transactions.list.deleted")),
    });
  }

  return (
    <div className="space-y-4">
      <Input
        aria-label={t("transactions.list.searchPlaceholder")}
        placeholder={t("transactions.list.searchPlaceholder")}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-xs"
      />

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
          <TransactionCardList
            transactions={data.items}
            onDelete={handleDelete}
            sourceLabel={sourceLabel}
          />
          <TransactionTable
            transactions={data.items}
            onDelete={handleDelete}
            sourceLabel={sourceLabel}
          />

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
