"use client";

import { Card } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  /** When true, renders a plain div instead of a form (for the sent state). */
  asDiv?: boolean;
}

/** Auth surface: Card variant "auth", rendered as the page's `<form>` unless `asDiv`. */
export default function AuthCard({ children, onSubmit, asDiv = false }: Props) {
  const cardProps = {
    variant: "auth" as const,
    className: "animate-fade-up",
    style: { animationDelay: "150ms" },
  };

  if (asDiv) {
    return <Card {...cardProps}>{children}</Card>;
  }

  return (
    <Card {...cardProps} asChild>
      <form onSubmit={onSubmit}>{children}</form>
    </Card>
  );
}
