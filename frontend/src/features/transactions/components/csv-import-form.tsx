"use client";

import { useState, useRef } from "react";
import { useImportCsv } from "../hooks/use-import-csv";
import { ImportResult } from "../types";
import { useAccounts } from "@/features/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";

export function CsvImportForm() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importCsv = useImportCsv();
  const { data: accounts } = useAccounts();
  const selectedAccountId = accountId || (accounts?.[0] ? String(accounts[0].id) : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError(t("transactions.csvImport.selectFile"));
      return;
    }

    try {
      const data = await importCsv.mutateAsync({ file, accountId: Number(selectedAccountId) });
      setResult(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(extractErrorMessage(err, t("transactions.csvImport.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm dark:text-red-400">{error}</p>}

      {result && (
        <div className="text-sm bg-green-50 border border-green-200 rounded p-3 text-green-800 space-y-1 dark:bg-green-950/40 dark:border-green-900 dark:text-green-400">
          <p>{t("transactions.csvImport.imported", { count: result.created })}</p>
          {result.skipped_duplicates > 0 && (
            <p>{t("transactions.csvImport.duplicatesSkipped", { count: result.skipped_duplicates })}</p>
          )}
          {result.invalid_rows > 0 && (
            <div className="text-amber-800 dark:text-amber-400">
              <p>{t("transactions.csvImport.invalidRows", { count: result.invalid_rows })}</p>
              <ul className="list-disc list-inside">
                {result.invalid_row_details.map((detail) => (
                  <li key={detail.row_number}>
                    {t("transactions.csvImport.rowLabel", {
                      row: detail.row_number,
                      reason: detail.reason,
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="csv-account">{t("transactions.csvImport.account")}</Label>
        <Combobox
          value={selectedAccountId}
          onValueChange={(value) => setAccountId(value ?? "")}
          items={accounts?.map((account) => ({
            value: String(account.id),
            label: account.name,
          }))}
        >
          <ComboboxTrigger id="csv-account" className="w-full">
            <ComboboxValue placeholder={t("transactions.csvImport.selectAccount")} />
          </ComboboxTrigger>
          <ComboboxContent
            searchPlaceholder={t("transactions.csvImport.searchAccount")}
            emptyMessage={t("transactions.csvImport.noAccountFound")}
          >
            {accounts?.map((account) => (
              <ComboboxItem key={account.id} value={String(account.id)}>
                {account.name}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="space-y-2">
        <Label htmlFor="csv-file">{t("transactions.csvImport.label")}</Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-xs text-muted-foreground">{t("transactions.csvImport.hint")}</p>
      </div>

      <Button type="submit" disabled={importCsv.isPending || !file || !selectedAccountId} className="w-full">
        {importCsv.isPending ? t("transactions.csvImport.importing") : t("transactions.csvImport.submit")}
      </Button>
    </form>
  );
}
