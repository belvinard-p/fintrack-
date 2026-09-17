"use client";

import Link from "next/link";
import {
  Receipt,
  Tag,
  Wallet,
  Repeat,
  Target,
  BarChart3,
  ShieldCheck,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/i18n";

const FEATURE_ICONS = [
  Receipt,
  Tag,
  Wallet,
  Repeat,
  Target,
  BarChart3,
  ShieldCheck,
  Globe,
] as const;

const FEATURE_KEYS = [
  "transactions",
  "categorization",
  "budgets",
  "recurring",
  "goals",
  "dashboard",
  "security",
  "languages",
] as const;

export default function GuidePage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen">
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("guide.backToHome")}
        </Link>
        <LanguageToggle />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-8">
        <div className="space-y-3 text-center py-8">
          <h1 className="text-3xl font-bold sm:text-4xl">{t("guide.title")}</h1>
          <p className="text-muted-foreground text-lg">{t("guide.subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURE_KEYS.map((key, index) => {
            const Icon = FEATURE_ICONS[index];
            return (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{t(`guide.features.${key}.title`)}</CardTitle>
                  </div>
                  <CardDescription>{t(`guide.features.${key}.description`)}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 space-y-4 rounded-xl border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold">{t("guide.cta.title")}</h2>
          <p className="text-muted-foreground">{t("guide.cta.subtitle")}</p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/register">
              <Button>{t("guide.cta.register")}</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">{t("guide.cta.login")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
