"use client";

import { useState } from "react";
import { toast } from "sonner";
import { exportTransactionsCsv } from "../services/transactions-api";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";

export function ExportCsvButton() {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportTransactionsCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err, t("transactions.export.error")));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
      {isExporting ? t("transactions.export.exporting") : t("transactions.export.button")}
    </Button>
  );
}
