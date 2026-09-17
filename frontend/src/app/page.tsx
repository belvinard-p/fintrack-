"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.push("/dashboard");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return null;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <h1 className="text-4xl font-bold">FinTrack</h1>
      <p className="text-muted-foreground">{t("home.tagline")}</p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button>{t("home.login")}</Button>
        </Link>

        <Link href="/register">
          <Button variant="outline">{t("home.register")}</Button>
        </Link>
      </div>
    </main>
  );
}