"use client";

import Link from "next/link";
import { t, mix } from "@/lib/theme";
import Header from "@/components/layout/Header";

export default function GrantsView() {
  return (
    <>
      <Header />

      <div className="flex flex-col px-9 py-6 overflow-hidden" style={{ height: "calc(100vh - 49px)" }}>
        <div className="mb-6 flex flex-col items-center gap-1">
          <h1 className="text-[44px] font-semibold tracking-[-0.04em] text-foreground">
            Government <span style={{ color: "var(--color-accent)" }}>Grants</span>
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <span
            className="inline-block rounded-[3px] text-[10px] font-bold uppercase tracking-[0.12em] leading-none"
            style={{
              padding: "5px 12px",
              color: mix("var(--color-accent)", 50),
              background: mix("var(--color-accent)", 8),
            }}
          >
            Coming soon
          </span>
        </div>

        <Link
          href="/"
          className="group mt-auto flex items-center justify-center gap-2 py-4 text-[14px] font-medium tracking-wide text-muted/30 no-underline transition-colors duration-300 hover:text-accent/70"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
          All Tools
        </Link>
      </div>
    </>
  );
}
