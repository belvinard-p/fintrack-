"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCategories } from "../hooks/use-categories";
import { useCreateCategory } from "../hooks/use-create-category";
import { useUpdateCategory } from "../hooks/use-update-category";
import { useDeleteCategory } from "../hooks/use-delete-category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryDot } from "@/components/category-dot";
import { useLanguage } from "@/lib/i18n";
import { stripDigits } from "@/lib/text";
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

export function CategoryManager() {
  const { t, language } = useLanguage();
  const { data: categories, isLoading, error } = useCategories();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  async function handleCreate(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      await createCategory.mutateAsync({ name: newName });
      setNewName("");
      toast.success(t("categories.created"));
    } catch (err) {
      setCreateError(extractErrorMessage(err, t("categories.createError")));
    }
  }

  function startEdit(id: number, currentName: string) {
    setEditingId(id);
    setEditName(currentName);
    setEditError(null);
  }

  async function handleUpdate(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setEditError(null);
    try {

      await updateCategory.mutateAsync({ id: editingId, name: editName });
      setEditingId(null);
      toast.success(t("categories.updated"));
    } catch (err) {
      setEditError(extractErrorMessage(err, t("categories.updateError")));
    }
  }

  if (isLoading) {
    return (
      <div aria-live="polite" className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) return <p aria-live="polite" className="text-red-600">{t("categories.failedToLoad")}</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder={t("categories.newCategoryPlaceholder")}
          value={newName}
          onChange={(e) => setNewName(stripDigits(e.target.value))}
          required
        />
        <Button type="submit" disabled={createCategory.isPending}>
          {createCategory.isPending ? t("categories.adding") : t("categories.add")}
        </Button>
      </form>
      {createError && <p className="text-red-600 text-sm">{createError}</p>}

      <div className="space-y-2">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="flex flex-col gap-3 border rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2">
              <CategoryDot categoryId={category.id} />
              <div className="flex flex-col">
                <span>{category.name}</span>
                {!category.is_default && category.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {t("categories.createdAt", {
                      date: new Date(category.created_at).toLocaleString(
                        language === "fr" ? "fr-FR" : "en-US",
                        { dateStyle: "medium", timeStyle: "short" }
                      ),
                    })}
                  </span>
                )}
              </div>
              {category.is_default && <Badge variant="secondary">{t("categories.default")}</Badge>}
            </div>

            {!category.is_default && (
              <div className="flex flex-wrap gap-2">
                <Dialog
                  open={editingId === category.id}
                  onOpenChange={(open) => !open && setEditingId(null)}
                >
                  <DialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(category.id, category.name)}
                      />
                    }
                  >
                    {t("common.edit")}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("categories.renameTitle")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                      {editError && <p className="text-red-600 text-sm">{editError}</p>}
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(stripDigits(e.target.value))}
                        required
                      />
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" type="button" />}>
                          {t("common.cancel")}
                        </DialogClose>
                        <Button type="submit" disabled={updateCategory.isPending}>
                          {updateCategory.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="sm" />}
                  >
                    {t("common.delete")}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("categories.deleteTitle", { name: category.name })}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("categories.deleteDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteCategory.mutate(category.id, {
                            onSuccess: () => toast.success(t("categories.deleted")),
                          })
                        }
                      >
                        {t("common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

        ))}
      </div>
    </div>
  );
}
