"use client";

import Link from "next/link";
import { TOOLS, TOOL_COLORS } from "@/lib/constants";
import type { Tool } from "@/lib/constants";
import { t, mix } from "@/lib/theme";
import Header from "@/components/layout/Header";

/* ── SVG Icons ────────────────────────────────────── */
const icons: Record<string, React.ReactNode> = {
  amortisation: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="28" width="8" height="14" rx="2" fill={mix(t.accent, 60)} />
      <rect x="20" y="18" width="8" height="24" rx="2" fill={mix(t.accent, 80)} />
      <rect x="34" y="8" width="8" height="34" rx="2" fill={t.accent} />
      <path d="M8 12L22 8L38 4" stroke={mix(t.accent, 40)} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  ),
  tax: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="10" y="8" width="28" height="32" rx="4" stroke={mix(t.accent, 40)} strokeWidth="1.5" />
      <rect x="14" y="12" width="20" height="8" rx="2" fill={mix(t.accent, 25)} />
      <circle cx="19" cy="28" r="2" fill={mix(t.accent, 50)} />
      <circle cx="29" cy="28" r="2" fill={mix(t.accent, 50)} />
      <circle cx="19" cy="34" r="2" fill={mix(t.accent, 70)} />
      <circle cx="29" cy="34" r="2" fill={mix(t.accent, 35)} />
    </svg>
  ),
  "ppor-vs-rent": (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="16" stroke="rgba(168,139,250,0.2)" strokeWidth="1.5" />
      <path d="M24 8V40" stroke="rgba(168,139,250,0.12)" strokeWidth="1" />
      <path d="M16 14L16 34" stroke="rgba(168,139,250,0.55)" strokeWidth="6" strokeLinecap="round" />
      <path d="M32 18L32 30" stroke="rgba(168,139,250,0.8)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  ),
  grants: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M10 18L24 10L38 18" stroke={mix(t.accent, 60)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18V36" stroke={mix(t.accent, 40)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 18V36" stroke={mix(t.accent, 55)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 18V36" stroke={mix(t.accent, 55)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36 18V36" stroke={mix(t.accent, 40)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 36H40" stroke={mix(t.accent, 70)} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "purchase-costs": (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="32" height="28" rx="4" stroke={mix(t.accent, 40)} strokeWidth="1.5" />
      <path d="M8 18H40" stroke={mix(t.accent, 25)} strokeWidth="1.5" />
      <path d="M16 24H28" stroke={mix(t.accent, 50)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 30H24" stroke={mix(t.accent, 35)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 36H20" stroke={mix(t.accent, 25)} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 24L34 26L38 22" stroke={mix(t.accent, 60)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  cashflow: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M10 34L18 26L26 30L38 14" stroke={mix(t.accent, 60)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 14H38V20" stroke={mix(t.accent, 40)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 20V38" stroke={mix(t.accent, 25)} strokeWidth="1" />
      <path d="M20 24C20 22 22 20 24 20C26 20 28 22 28 24C28 26 22 26 22 28C22 30 24 32 26 32" stroke={mix(t.accent, 50)} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "offset-impact": (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="12" width="32" height="24" rx="4" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" />
      <path d="M8 20H40" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
      <circle cx="24" cy="28" r="4" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" />
      <path d="M22 28L24 26L26 28" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "rate-changes": (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M8 36L16 28L24 32L32 16L40 12" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="12" r="3" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" />
      <path d="M36 12H40V16" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "equity-growth": (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M14 38V24L24 16L34 24V38" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="20" y="30" width="8" height="8" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" />
      <path d="M10 26L24 14L38 26" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "tax-deductions": (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="12" y="8" width="24" height="32" rx="3" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" />
      <path d="M18 18H30" stroke="rgba(148,163,184,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 24H30" stroke="rgba(148,163,184,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 30H26" stroke="rgba(148,163,184,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 28L32 32L36 24" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ── ToolCard ─────────────────────────────────────── */
function ToolCard({ tool }: { tool: Tool }) {
  const color = TOOL_COLORS[tool.id] ?? { primary: "#94a3b8", glow: "rgba(148,163,184,0.08)" };
  const c = color.primary;

  const card = (
    <div
      className={`group relative overflow-hidden flex flex-col items-center justify-center text-center px-9 py-11 rounded-3xl backdrop-blur-[12px] transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] max-[480px]:px-5 max-[480px]:py-8 ${
        tool.active
          ? "cursor-pointer hover:-translate-y-1 hover:scale-[1.015]"
          : "cursor-default opacity-50"
      }`}
      style={tool.active ? {
        background: mix(c, 4),
        border: `1px solid ${mix(c, 28)}`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.4), 0 0 0 0.5px ${mix(c, 6)}, inset 0 1px 0 rgba(255,255,255,0.03)`,
      } : {
        background: "rgba(30,30,34,0.45)",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
      onMouseEnter={tool.active ? (e) => {
        e.currentTarget.style.background = mix(c, 6.5);
        e.currentTarget.style.borderColor = mix(c, 35);
        e.currentTarget.style.boxShadow = `0 20px 50px -12px rgba(0,0,0,0.6), 0 0 0 0.5px ${mix(c, 12)}, 0 0 30px -8px ${mix(c, 6)}, inset 0 1px 0 rgba(255,255,255,0.04)`;
      } : undefined}
      onMouseLeave={tool.active ? (e) => {
        e.currentTarget.style.background = mix(c, 4);
        e.currentTarget.style.borderColor = mix(c, 28);
        e.currentTarget.style.boxShadow = `0 2px 16px rgba(0,0,0,0.4), 0 0 0 0.5px ${mix(c, 6)}, inset 0 1px 0 rgba(255,255,255,0.03)`;
      } : undefined}
    >
      {/* Accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] scale-x-0 origin-left transition-transform duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${c}, ${mix(c, 15)})` }}
      />
      {/* Shine sweep */}
      <div
        className="absolute top-0 -left-full w-full h-full opacity-0 pointer-events-none transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:left-full group-hover:opacity-35"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${mix(c, 4)} 45%, ${mix(c, 8)} 50%, ${mix(c, 4)} 55%, transparent 60%)`,
        }}
      />

      {/* Icon */}
      <div
        className="mb-6 leading-none w-[88px] h-[88px] flex items-center justify-center rounded-[20px] border transition-transform duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
        style={tool.active ? {
          background: mix(c, 6),
          borderColor: mix(c, 42),
          boxShadow: `0 0 18px ${mix(c, 18)}`,
        } : {
          background: "rgba(255,255,255,0.02)",
          borderColor: "rgba(255,255,255,0.035)",
        }}
      >
        <div className="w-14 h-14 [&>svg]:w-14 [&>svg]:h-14">{icons[tool.id]}</div>
      </div>

      {/* Title */}
      <h2 className={`text-[22px] font-semibold tracking-[-0.01em] m-0 leading-[1.2] ${
        tool.active ? "text-foreground" : "text-foreground/50"
      }`}>{tool.title}</h2>

      {/* Description */}
      <p className={`text-[13px] font-normal mt-2 mb-0 leading-[1.45] tracking-[0.01em] ${
        tool.active ? "text-[rgba(148,163,184,0.3)]" : "text-[rgba(148,163,184,0.2)]"
      }`}>{tool.desc}</p>

      {/* Arrow */}
      {tool.active && (
        <span
          className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-1 flex items-center justify-center w-8 h-8 rounded-full opacity-0 transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0 max-[480px]:hidden"
          style={{
            background: mix(c, 8),
            border: `1px solid ${mix(c, 18)}`,
            color: mix(c, 65),
          }}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}

      {/* Badge */}
      <span className={`absolute top-4 right-4 text-[9px] font-semibold uppercase tracking-widest px-2 py-[3px] rounded leading-none max-[480px]:top-2.5 max-[480px]:right-2.5 max-[480px]:text-[8px] max-[480px]:px-1.5 max-[480px]:py-[2px] ${
        tool.badge === "Beta"
          ? "text-[rgba(168,139,250,0.95)] bg-[rgba(168,139,250,0.12)] backdrop-blur-[12px]"
          : tool.active
            ? "text-[#111]"
            : "text-[rgba(250,204,21,0.85)] bg-[rgba(250,204,21,0.12)]"
      }`}
        style={!tool.badge && tool.active ? {
          background: `linear-gradient(135deg, ${c}, ${mix(c, 70)})`,
        } : undefined}
      >
        {tool.badge ?? (tool.active ? "Live" : "Soon")}
      </span>
    </div>
  );

  if (tool.active) {
    return <Link href={`/${tool.id}`} className="no-underline text-inherit outline-none focus-visible:[&>div]:shadow-[0_0_0_2px_rgba(45,212,191,0.3),0_4px_24px_-4px_rgba(0,0,0,0.4)]">{card}</Link>;
  }

  return card;
}

/* ── Page ──────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 home-bg-glow pointer-events-none z-0" />
      <div className="fixed inset-0 home-bg-noise pointer-events-none z-0" />

      <div className="relative z-[1]">
        <Header />
      </div>

      {/* Hero + Cards */}
      <main className="relative z-[1] flex flex-col items-center flex-1 px-10 pt-12 pb-10 text-center max-[900px]:px-6 max-[900px]:pt-8 max-[480px]:px-4 max-[480px]:pt-6">
        {/* Ambient glow */}
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[70%] h-1/2 pointer-events-none z-0"
          style={{ background: `radial-gradient(ellipse 45% 40% at 50% 40%, ${mix("var(--color-accent)", 2)} 0%, transparent 70%)` }}
        />

        <h1 className="relative z-[1] text-[3.75rem] font-semibold text-foreground tracking-[-0.035em] m-0 leading-[1.1] whitespace-nowrap animate-fade-up max-[900px]:text-[2.5rem] max-[680px]:text-[1.75rem] max-[680px]:whitespace-normal max-[480px]:text-[1.35rem]">
          Model property decisions with precision.
        </h1>

        <div className="relative z-[1] flex flex-wrap justify-center gap-2 mt-5 animate-fade-up [animation-delay:0.2s] max-[480px]:gap-1.5">
          {["Daily compounding", "AUD", "No sign-up", "Free forever"].map((pill) => (
            <span key={pill} className="text-[11px] font-medium tracking-[0.04em] text-[rgba(148,163,184,0.4)] px-3 py-1 rounded-full border border-[rgba(148,163,184,0.08)] bg-[rgba(148,163,184,0.03)] max-[480px]:text-[10px] max-[480px]:px-2.5 max-[480px]:py-[3px]">
              {pill}
            </span>
          ))}
        </div>

        <div className="relative z-[1] flex-1 flex flex-col items-center justify-center w-full -mt-5 animate-fade-up [animation-delay:0.3s]">
          {/* Featured (active) cards */}
          <div className="w-full max-w-[1300px] mb-9 grid grid-cols-4 gap-6 animate-fade-up [animation-delay:0.35s] max-[900px]:grid-cols-3 max-[900px]:gap-3.5 max-[680px]:grid-cols-2 max-[480px]:grid-cols-2 max-[480px]:gap-3">
            {TOOLS.filter((t) => t.active).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          {/* Divider */}
          <div className="w-full max-w-[1300px] flex items-center gap-4 mb-5 animate-fade-up [animation-delay:0.5s]">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(148,163,184,0.1)] to-transparent" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(148,163,184,0.2)] whitespace-nowrap">Coming soon</span>
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(148,163,184,0.1)] to-transparent" />
          </div>

          {/* Coming soon cards */}
          <div className="w-full max-w-[1300px] grid grid-cols-4 gap-6 animate-fade-up [animation-delay:0.6s] max-[900px]:grid-cols-3 max-[900px]:gap-3.5 max-[680px]:grid-cols-2 max-[480px]:grid-cols-2 max-[480px]:gap-3">
            {TOOLS.filter((t) => !t.active).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-[1] px-10 py-5 border-t border-white/[0.04] max-[900px]:px-6 max-[900px]:py-4 max-[480px]:px-4 max-[480px]:py-3">
        <div className="flex items-center justify-center gap-2 text-[11px] text-[rgba(148,163,184,0.25)]">
          <span className="font-semibold text-[rgba(148,163,184,0.35)]">Mortgage Modeler</span>
          <span className="text-[rgba(148,163,184,0.12)]">&middot;</span>
          <span>v0.1</span>
        </div>
      </footer>
    </div>
  );
}
