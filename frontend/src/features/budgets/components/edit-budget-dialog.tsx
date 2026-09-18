"use client";

import { useUpdateBudget } from "../hooks/use-update-budget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface EditBudgetDialogProps {
  id: number;
  categoryName: string;
  currentLimit: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTriggerClick: () => void;
}

export function EditBudgetDialog({
  id,
  categoryName,
  currentLimit,
  open,
  onOpenChange,
  onTriggerClick,
}: Readonly<EditBudgetDialogProps>) {
  const { t } = useLanguage();
  const updateBudget = useUpdateBudget();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limit = (e.currentTarget.elements.namedItem("monthly_limit") as HTMLInputElement).value;
    try {
      await updateBudget.mutateAsync({ id, payload: { monthly_limit: limit } });
      onOpenChange(false);
      const { toast } = await import("sonner");
      toast.success(t("budgets.status.updated"));
    } catch (err) {
      const { extractErrorMessage: extract } = await import("@/lib/error");
      const { toast } = await import("sonner");
      toast.error(extract(err, t("budgets.status.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" onClick={onTriggerClick} />}
      >
        {t("common.edit")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("budgets.status.editTitle", { category: categoryName })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly_limit">{t("budgets.status.monthlyLimitLabel")}</Label>
            <Input
              id="monthly_limit"
              name="monthly_limit"
              type="number"
              step="0.01"
              defaultValue={currentLimit}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={updateBudget.isPending}>
              {updateBudget.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
