"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { useCurrentUser } from "../hooks/use-current-user";

/** Tells a visitor they are in a throwaway demo account, and offers to create a real one. Shown to demo accounts only. */
export function DemoBanner() {
  const { t } = useLanguage();
  const { data: user } = useCurrentUser();

  if (!user?.is_demo) {
    return null;
  }

  return (
    <div role="status" className="border-b bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <span>{t("demo.banner")}</span>{" "}
      <Link href="/register" className="font-medium underline underline-offset-4">
        {t("demo.createAccount")}
      </Link>
    </div>
  );
}
