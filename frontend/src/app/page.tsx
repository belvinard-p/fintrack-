"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/session";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">FinTrack</h1>
      <p className="text-gray-600">Track your spending. Understand your money.</p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button>Log in</Button>
        </Link>

        <Link href="/register">
          <Button variant="outline">Register</Button>
        </Link>
      </div>
    </main>
  );
}