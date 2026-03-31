"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";

export default function PurchaseCostsView() {
  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center px-9 py-6" style={{ height: "calc(100vh - 49px)" }}>
        <h1 className="text-[44px] font-semibold tracking-[-0.04em] text-foreground">
          Purchase <span style={{ color: "var(--color-accent)" }}>Costs</span>
        </h1>
        <p className="mt-4 text-[16px] text-muted/40">Coming soon</p>
        <Link
          href="/"
          className="group mt-8 flex items-center gap-2 text-[14px] font-medium tracking-wide text-muted/30 no-underline transition-colors duration-300 hover:text-accent/70"
        >
          <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">&larr;</span>
          All Tools
        </Link>
      </div>
    </>
  );
}
