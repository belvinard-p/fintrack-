"use client";

import { useState, useRef } from "react";
import { useImportCsv } from "../hooks/use-import-csv";
import { ImportResult } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CsvImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importCsv = useImportCsv();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    try {
      const data = await importCsv.mutateAsync(file);
      setResult(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to import CSV");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="text-sm bg-green-50 border border-green-200 rounded p-3 text-green-800 space-y-1">
          <p>Imported {result.created} new transaction(s).</p>
          {result.skipped_duplicates > 0 && (
            <p>{result.skipped_duplicates} duplicate(s) skipped.</p>
          )}
          {result.invalid_rows > 0 && (
            <div className="text-amber-800">
              <p>{result.invalid_rows} row(s) could not be read and were skipped:</p>
              <ul className="list-disc list-inside">
                {result.invalid_row_details.map((detail) => (
                  <li key={detail.row_number}>
                    Row {detail.row_number}: {detail.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="csv-file">Bank statement (CSV)</Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-xs text-gray-500">
          Needs a date, description, and amount column (common bank export names are
          recognized automatically).
        </p>
      </div>

      <Button type="submit" disabled={importCsv.isPending || !file} className="w-full">
        {importCsv.isPending ? "Importing..." : "Import CSV"}
      </Button>
    </form>
  );
}