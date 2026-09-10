"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/session";

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

  if (!checked) {
    return null;
  }

  return <>{children}</>;
}
