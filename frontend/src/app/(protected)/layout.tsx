"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { getToken, clearToken } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useAutoGenerateRecurring } from "@/features/recurring-transactions";
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
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold">{t("nav.brand")}</span>
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
              className="sm:hidden p-2 -mr-2"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden mt-4 flex flex-col gap-4 border-t pt-4">
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
        )}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}