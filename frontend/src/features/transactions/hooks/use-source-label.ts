import { useLanguage } from "@/lib/i18n";

export function useSourceLabel() {
  const { t } = useLanguage();

  return function sourceLabel(source: string): string {
    if (source === "manual") return t("transactions.list.sourceManual");
    if (source === "csv_import") return t("transactions.list.sourceCsvImport");
    if (source === "recurring") return t("transactions.list.sourceRecurring");
    return source.replace("_", " ");
  };
}
