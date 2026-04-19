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
    <div className="flex flex-col items-center justify-center py-24">
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
        <h1 className="text-[18px] font-medium text-foreground/80 tracking-tight m-0 mb-2">
          {meta.title}
        </h1>
        <p className="text-[11px] m-0 mb-5" style={{ color: "rgba(148,163,184,0.35)", lineHeight: 1.5 }}>
          {meta.desc}
        </p>
        <span
          className="inline-block rounded-[3px] text-[8px] font-semibold uppercase tracking-widest leading-none"
          style={{
            padding: "3px 8px",
            color: "rgba(148,163,184,0.35)",
            background: "rgba(148,163,184,0.08)",
          }}
        >
          Coming soon
        </span>
      </div>
    </div>
  );
}
