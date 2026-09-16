"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteAccount } from "../hooks/use-delete-account";
import { clearToken } from "@/lib/session";
import { Button } from "@/components/ui/button";
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

export function DeleteAccountSection() {
  const router = useRouter();
  const deleteAccount = useDeleteAccount();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteAccount.mutateAsync();
      clearToken();
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete account");
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          Delete account
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and all of your transactions, budgets,
              and categories. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
