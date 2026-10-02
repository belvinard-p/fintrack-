import { useLanguage } from "@/lib/i18n";

export function useSourceLabel() {
  const { t } = useLanguage();

  return function sourceLabel(source: string): string {
    if (source === "manual") return t("transactions.list.sourceManual");
    if (source === "csv_import") return t("transactions.list.sourceCsvImport");
    if (source === "recurring") return t("transactions.list.sourceRecurring");
    if (source === "debt_payment") return t("transactions.list.sourceDebtPayment");
    if (source === "goal_contribution") return t("transactions.list.sourceGoalContribution");
    return source.replace("_", " ");
  };
}
