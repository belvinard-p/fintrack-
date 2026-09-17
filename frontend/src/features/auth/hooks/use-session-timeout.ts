"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearToken, getLoginTime, markLoginTime } from "@/lib/session";
import { useLanguage } from "@/lib/i18n";

const IDLE_LIMIT_MINUTES = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES) || 15;
const ABSOLUTE_LIMIT_MINUTES = Number(process.env.NEXT_PUBLIC_SESSION_ABSOLUTE_MINUTES) || 60;

const IDLE_LIMIT_MS = IDLE_LIMIT_MINUTES * 60 * 1000;
const ABSOLUTE_LIMIT_MS = ABSOLUTE_LIMIT_MINUTES * 60 * 1000;
const CHECK_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_SESSION_CHECK_INTERVAL_MS) || 5000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

export function useSessionTimeout() {
  const router = useRouter();
  const { t } = useLanguage();
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!getLoginTime()) {
      markLoginTime();
    }

    function handleActivity() {
      lastActivityRef.current = Date.now();
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity));

    const interval = setInterval(() => {
      const now = Date.now();
      const idleFor = now - lastActivityRef.current;
      const loginTime = getLoginTime();
      const sessionAge = loginTime ? now - loginTime : 0;

      if (idleFor >= IDLE_LIMIT_MS || sessionAge >= ABSOLUTE_LIMIT_MS) {
        clearToken();
        toast.info(t("auth.session.expired"));
        router.push("/login");
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      clearInterval(interval);
    };
  }, [router, t]);
}
