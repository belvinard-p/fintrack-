"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/lib/i18n";
import { useStartDemo } from "../hooks/use-start-demo";

/** Too many demo accounts requested from this network: the server answers 429, with a body that is not a French message. */
function isRateLimited(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 429;
}

interface TryDemoButtonProps {
  variant?: "default" | "outline" | "ghost";
  className?: string;
  /** Show the one-line explanation and any error under the button. */
  showHint?: boolean;
}

/** One click to explore the app with six months of sample data, without registering. */
export function TryDemoButton({ variant = "outline", className, showHint = false }: Readonly<TryDemoButtonProps>) {
  const { t } = useLanguage();
  const demo = useStartDemo();

  return (
    <div className="space-y-2">
      <Button type="button" variant={variant} className={className} disabled={demo.isPending} onClick={() => demo.mutate()}>
        {demo.isPending && <Spinner className="size-4" />}
        {demo.isPending ? t("demo.starting") : t("demo.try")}
      </Button>
      {demo.isError && (
        <p role="alert" className="text-red-600 text-sm">
          {isRateLimited(demo.error) ? t("demo.rateLimited") : t("demo.error")}
        </p>
      )}
      {showHint && !demo.isError && <p className="text-xs text-muted-foreground">{t("demo.hint")}</p>}
    </div>
  );
}
