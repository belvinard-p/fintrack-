"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRecurringTransactions } from "../hooks/use-recurring-transactions";
import { useUpdateRecurringTransaction } from "../hooks/use-update-recurring-transaction";
import { useDeleteRecurringTransaction } from "../hooks/use-delete-recurring-transaction";
import { useCategories } from "@/features/categories";
import { RecurringTransaction } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryDot } from "@/components/category-dot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";
import { extractErrorMessage } from "@/lib/error";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function EditRecurringTransactionDialog({ item }: Readonly<{ item: RecurringTransaction }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(item.description);
  const [amount, setAmount] = useState(item.amount);
  const [dayOfMonth, setDayOfMonth] = useState(String(item.day_of_month));
  const [categoryId, setCategoryId] = useState(item.category_id ? String(item.category_id) : "");
  const [error, setError] = useState<string | null>(null);

  const updateRecurring = useUpdateRecurringTransaction();
  const { data: categories } = useCategories();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDescription(item.description);
      setAmount(item.amount);
      setDayOfMonth(String(item.day_of_month));
      setCategoryId(item.category_id ? String(item.category_id) : "");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await updateRecurring.mutateAsync({
        id: item.id,
        payload: {
          description,
          amount,
          day_of_month: parseInt(dayOfMonth, 10),
          category_id: categoryId ? parseInt(categoryId, 10) : null,
        },
      });
      setOpen(false);
      toast.success(t("recurring.list.updated"));
    } catch (err: any) {
      setError(extractErrorMessage(err, t("recurring.list.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.edit")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("recurring.list.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor={`edit-recurring-description-${item.id}`}>
              {t("recurring.form.description")}
            </Label>
            <Input
              id={`edit-recurring-description-${item.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-recurring-amount-${item.id}`}>{t("recurring.form.amount")}</Label>
            <Input
              id={`edit-recurring-amount-${item.id}`}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-recurring-day-${item.id}`}>{t("recurring.form.dayOfMonth")}</Label>
            <Input
              id={`edit-recurring-day-${item.id}`}
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-recurring-category-${item.id}`}>{t("recurring.form.category")}</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? "")}
              items={categories?.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
            >
              <SelectTrigger id={`edit-recurring-category-${item.id}`} className="w-full">
                <SelectValue placeholder={t("recurring.form.uncategorized")} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    <span className="flex items-center gap-2">
                      <CategoryDot categoryId={category.id} />
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={updateRecurring.isPending}>
              {updateRecurring.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecurringTransactionList() {
  const { t } = useLanguage();
  const { data: recurring, isLoading, error } = useRecurringTransactions();
  const updateRecurring = useUpdateRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();

  return (
    <div aria-live="polite" className="space-y-3">
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}
      {error && <p className="text-red-600">{t("recurring.list.failedToLoad")}</p>}
      {recurring && recurring.length === 0 && (
        <p className="text-muted-foreground">{t("recurring.list.empty")}</p>
      )}

      {recurring && recurring.length > 0 && (
        <div className="space-y-3">
          {recurring.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 border rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
            >
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
                              checked
                                ? t("recurring.list.resumed")
                                : t("recurring.list.pausedToast")
                            ),
                        }
                      )
                    }
                  />
                </div>
                <EditRecurringTransactionDialog item={item} />
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
                    {t("common.delete")}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("recurring.list.deleteTitle", { description: item.description })}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("recurring.list.deleteDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteRecurring.mutate(item.id, {
                            onSuccess: () => toast.success(t("recurring.list.deleted")),
                          })
                        }
                      >
                        {t("common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
