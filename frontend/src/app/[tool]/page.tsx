import Link from "next/link";
import { notFound } from "next/navigation";
import { t } from "@/lib/theme";
import { TOOLS } from "@/lib/constants";

const PLACEHOLDER_IDS = TOOLS.filter((tool) => !tool.active).map((tool) => tool.id);

interface Props {
  params: Promise<{ tool: string }>;
}

export default async function ToolPlaceholder({ params }: Props) {
  const { tool } = await params;

  if (!PLACEHOLDER_IDS.includes(tool)) {
    notFound();
  }

  const meta = TOOLS.find((t) => t.id === tool)!;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: t.bg.page }}>
      <header
        className="flex items-center justify-between px-7 py-3"
        style={{ borderBottom: `1px solid ${t.border.default}` }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-zinc-900"
            style={{ background: t.accent }}
          >
            M
          </div>
          <span className="text-[14px] font-semibold text-zinc-100/75 tracking-tight">
            MortgageModeler
          </span>
        </Link>
        <Link
          href="/"
          className="text-[10px] font-semibold uppercase tracking-[0.1em] no-underline transition-colors"
          style={{ color: "rgba(148,163,184,0.4)" }}
        >
          ← Back
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-7">
        <div
          className="rounded-[14px] backdrop-blur-md text-center"
          style={{
            padding: "40px 48px",
            background: t.bg.card,
            border: `1px solid ${t.border.default}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.20), 0 0 0 0.5px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.02)",
            maxWidth: 360,
          }}
        >
          <div className="text-[36px] mb-4">{meta.icon}</div>
          <h1 className="text-[18px] font-medium text-zinc-50/80 tracking-tight m-0 mb-2">
            {meta.title}
          </h1>
          <p className="text-[11px] m-0 mb-5" style={{ color: "rgba(148,163,184,0.35)", lineHeight: 1.5 }}>
            {meta.desc}
          </p>
          <span
            className="inline-block rounded-[3px] text-[8px] font-bold uppercase tracking-[0.12em] leading-none"
            style={{
              padding: "3px 8px",
              color: "rgba(148,163,184,0.35)",
              background: "rgba(148,163,184,0.08)",
            }}
          >
            Coming soon
          </span>
        </div>
      </main>
    </div>
  );
}
