"use client";

import Link from "next/link";

export default function BackToSignIn() {
  return (
    <Link
      href="/login"
      className="animate-fade-up"
      style={{
        marginTop: 24,
        fontSize: 13,
        color: "var(--color-fg-secondary)",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        animationDelay: "200ms",
        transition: "color 0.2s ease, gap 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--color-fg-primary)";
        e.currentTarget.style.gap = "8px";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--color-fg-secondary)";
        e.currentTarget.style.gap = "6px";
      }}
    >
      <span>←</span>
      Back to sign in
    </Link>
  );
}