"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "cn";
import { getToken, clearToken } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { PageSpinner } from "@/components/page-spinner";
import { useAutoGenerateRecurring } from "@/features/recurring-transactions";
import { useSessionTimeout } from "@/features/auth";
import { useLanguage } from "@/lib/i18n";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/transactions", label: t("nav.transactions") },
    { href: "/recurring", label: t("nav.recurring") },
    { href: "/budgets", label: t("nav.budgets") },
    { href: "/goals", label: t("nav.goals") },
    { href: "/settings", label: t("nav.settings") },
  ];

  useAutoGenerateRecurring();
  useSessionTimeout();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (!checked) {
    return <PageSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold hover:opacity-80 transition-opacity">{t("nav.brand")}</Link>
            <div className="hidden sm:flex items-center gap-6">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "text-sm font-medium text-foreground"
                        : "text-sm text-muted-foreground hover:text-foreground"
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:inline-flex"
            >
              {t("nav.logout")}
            </Button>
            <button
              type="button"
              className="sm:hidden p-2 -mr-2 transition-transform duration-200"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={cn("block transition-transform duration-200", menuOpen && "rotate-90")}>
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </span>
            </button>
          </div>
        </div>

        <div
          className={cn(
            "sm:hidden grid transition-[grid-template-rows] duration-200 ease-in-out",
            menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div
            aria-hidden={!menuOpen}
            className={cn(
              "overflow-hidden transition-opacity duration-200",
              menuOpen ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="-mx-4 mt-4 flex flex-col gap-4 border-t bg-background px-4 pt-4 pb-4 shadow-md">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    tabIndex={menuOpen ? undefined : -1}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "text-sm font-medium text-foreground"
                        : "text-sm text-muted-foreground hover:text-foreground"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("nav.theme")}</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("nav.language")}</span>
                <LanguageToggle />
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                {t("nav.logout")}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}