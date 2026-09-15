"use client";

import { useState } from "react";
import { useCategories } from "../hooks/use-categories";
import { useCreateCategory } from "../hooks/use-create-category";
import { useUpdateCategory } from "../hooks/use-update-category";
import { useDeleteCategory } from "../hooks/use-delete-category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export function CategoryManager() {
  const { data: categories, isLoading, error } = useCategories();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      await createCategory.mutateAsync({ name: newName });
      setNewName("");
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || "Failed to create category");
    }
  }

  function startEdit(id: number, currentName: string) {
    setEditingId(id);
    setEditName(currentName);
    setEditError(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setEditError(null);
    try {

      await updateCategory.mutateAsync({ id: editingId, name: editName });
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || "Failed to update category");
    }
  }

  if (isLoading) return <p>Loading categories...</p>;
  if (error) return <p className="text-red-600">Failed to load categories</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <Button type="submit" disabled={createCategory.isPending}>
          {createCategory.isPending ? "Adding..." : "Add"}
        </Button>
      </form>
      {createError && <p className="text-red-600 text-sm">{createError}</p>}

      <div className="space-y-2">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between border rounded-lg p-3"
          >
            <div className="flex items-center gap-2">

              <span>{category.name}</span>
              {category.is_default && <Badge variant="secondary">Default</Badge>}
            </div>

            {!category.is_default && (
              <div className="flex gap-2">
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
                    Edit
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rename category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                      {editError && <p className="text-red-600 text-sm">{editError}</p>}
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={updateCategory.isPending}>

                          {updateCategory.isPending ? "Saving..." : "Save"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="sm" />}
                  >
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Any transactions using this category will become uncategorized.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCategory.mutate(category.id)}>
                        Delete
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