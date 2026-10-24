"use client";

import Link from "next/link";
import {
  Receipt,
  Banknote,
  Tag,
  Wallet,
  Repeat,
  Target,
  BarChart3,
  FileText,
  ShieldCheck,
  Globe,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/i18n";

const CORE_FEATURES = [
  { key: "transactions", icon: Receipt },
  { key: "income", icon: Banknote },
  { key: "categorization", icon: Tag },
  { key: "budgets", icon: Wallet },
  { key: "recurring", icon: Repeat },
  { key: "goals", icon: Target },
  { key: "dashboard", icon: BarChart3 },
] as const;

const EXTRA_FEATURES = [
  { key: "reports", icon: FileText },
  { key: "security", icon: ShieldCheck },
  { key: "languages", icon: Globe },
] as const;

const STEPS = [
  "transactions",
  "income",
  "budgets",
  "dashboard",
] as const;

export default function GuidePage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t("common.backToHome")}
        </Link>
        <LanguageToggle />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-8 space-y-16">

        {/* Hero */}
        <div className="space-y-4 text-center pt-8">
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1">FinTrack</Badge>
          <h1 className="text-3xl font-bold sm:text-4xl tracking-tight">{t("guide.title")}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("guide.subtitle")}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/register">
              <Button size="sm">{t("guide.cta.register")}</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" variant="outline">{t("guide.cta.login")}</Button>
            </Link>
          </div>
        </div>

        {/* How it works — numbered steps */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-center">
            {t("home.howItWorks")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((key, i) => (
              <div key={key} className="flex gap-4 rounded-xl border bg-card p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <p className="font-medium leading-snug">{t(`guide.features.${key}.title`)}</p>
                  <p className="text-sm text-muted-foreground">{t(`guide.features.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All features grid */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-center">
            {t("guide.title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CORE_FEATURES.map(({ key, icon: Icon }) => (
              <Card key={key} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-base">{t(`guide.features.${key}.title`)}</CardTitle>
                  </div>
                  <CardDescription>{t(`guide.features.${key}.description`)}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Security & extras */}
        <section className="rounded-xl border bg-muted/40 p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("guide.extras")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {EXTRA_FEATURES.map(({ key, icon: Icon }) => (
              <Card key={key} className="bg-background">
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    <span className="text-sm font-medium">{t(`guide.features.${key}.title`)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t(`guide.features.${key}.description`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Checklist summary */}
        <section className="rounded-xl border bg-card p-6 space-y-3">
          {(["transactions", "income", "categorization", "budgets", "recurring", "goals", "dashboard", "reports", "security", "languages"] as const).map((key) => (
            <div key={key} className="flex items-start gap-3">
              <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-sm">{t(`guide.features.${key}.title`)}</span>
            </div>
          ))}
        </section>

        {/* CTA */}
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">{t("guide.cta.title")}</h2>
          <p className="text-muted-foreground">{t("guide.cta.subtitle")}</p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/register">
              <Button size="lg">{t("guide.cta.register")}</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">{t("guide.cta.login")}</Button>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
