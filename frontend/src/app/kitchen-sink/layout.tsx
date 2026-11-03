import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen sink · MortgageModeler",
  robots: { index: false, follow: false },
};

/** Bare layout: no app shell (sidebar, header), just the page surface. */
export default function KitchenSinkLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-dvh bg-surface-app text-fg-primary">{children}</div>;
}
