"use client";

import { toast } from "sonner";
import { useUpdateRecurringTransaction } from "../hooks/use-update-recurring-transaction";
import { RecurringTransaction } from "../types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CategoryDot } from "@/components/category-dot";
import { EditRecurringTransactionDialog } from "./edit-recurring-transaction-dialog";
import { DeleteRecurringTransactionDialog } from "./delete-recurring-transaction-dialog";
import { useLanguage } from "@/lib/i18n";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";

export function RecurringTransactionItem({ item }: Readonly<{ item: RecurringTransaction }>) {
  const { t } = useLanguage();
  const updateRecurring = useUpdateRecurringTransaction();

  return (
    <div className="flex flex-col gap-3 border rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 font-medium">
          <CategoryDot categoryId={item.category_id} />
          {item.description}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className={amountColorClass(item.amount)}>{formatSignedAmount(item.amount)}</span>
          {" · "}
          {t("recurring.list.dayOfMonth", { day: item.day_of_month })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!item.is_active && <Badge variant="secondary">{t("recurring.list.paused")}</Badge>}
        <div className="flex items-center gap-2">
          <Label htmlFor={`active-${item.id}`} className="text-sm">
            {t("recurring.list.active")}
          </Label>
          <Switch
            id={`active-${item.id}`}
            checked={item.is_active}
            onCheckedChange={(checked) =>
              updateRecurring.mutate(
                { id: item.id, payload: { is_active: checked } },
                {
                  onSuccess: () =>
                    toast.success(
                      checked ? t("recurring.list.resumed") : t("recurring.list.pausedToast")
                    ),
                }
              )
            }
          />
        </div>
        <EditRecurringTransactionDialog item={item} />
        <DeleteRecurringTransactionDialog item={item} />
      </div>
    </div>
  );
}
