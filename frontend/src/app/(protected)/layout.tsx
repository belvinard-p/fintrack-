"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, clearToken } from "@/lib/session";
import { Button } from "@/components/ui/button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

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
      <nav className="border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold">FinTrack</span>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black">
            Dashboard
          </Link>
          <Link href="/transactions" className="text-sm text-gray-600 hover:text-black">
            Transactions
          </Link>
          <Link href="/budgets" className="text-sm text-gray-600 hover:text-black">
            Budgets
          </Link>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}