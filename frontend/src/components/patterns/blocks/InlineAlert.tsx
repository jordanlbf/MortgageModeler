import type { ComponentProps } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "cn";

const TONES = {
  error: { Icon: AlertCircle, cls: "border-status-error/20 bg-status-error-bg text-status-error" },
  warning: { Icon: TriangleAlert, cls: "border-status-warning/20 bg-status-warning-bg text-status-warning" },
  success: { Icon: CheckCircle2, cls: "border-status-success/20 bg-status-success-bg text-status-success" },
  info: { Icon: Info, cls: "border-status-info/20 bg-status-info/5 text-status-info" },
} as const;

/**
 * A one-line message in a tinted box: API errors, warnings, confirmations.
 * Errors are announced immediately (`role="alert"`); other tones politely.
 *
 * Every view's error banner uses this, so edit it to restyle them all.
 */
export default function InlineAlert({
  tone = "error",
  className,
  children,
  ...props
}: ComponentProps<"div"> & { tone?: keyof typeof TONES }) {
  const { Icon, cls } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      data-pattern="inline-alert"
      className={cn("flex items-center gap-2.5 rounded-lg border px-4 py-3 text-[13px] leading-snug", cls, className)}
      {...props}
    >
      <Icon size={15} className="shrink-0" aria-hidden="true" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
