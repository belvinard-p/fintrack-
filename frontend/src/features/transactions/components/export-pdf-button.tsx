"use client";

import { useState } from "react";
import { toast } from "sonner";
import { exportTransactionsPdf } from "../services/transactions-api";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";

export function ExportPdfButton() {
  const { t, language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportTransactionsPdf(language);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err, t("transactions.export.error")));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
      {isExporting ? t("transactions.export.exportingPdf") : t("transactions.export.buttonPdf")}
    </Button>
  );
}
