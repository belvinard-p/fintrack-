"use client";

import { useState } from "react";
import { exportTransactionsCsv } from "../services/transactions-api";
import { Button } from "@/components/ui/button";

export function ExportCsvButton() {
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
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
