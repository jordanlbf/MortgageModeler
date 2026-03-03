import Link from "next/link";
import { TOOLS } from "@/lib/constants";
import type { Tool } from "@/lib/constants";
import "./home.css";

/* ── SVG Icons ────────────────────────────────────── */
const icons: Record<string, React.ReactNode> = {
  amortisation: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="28" width="8" height="14" rx="2" fill="rgba(45,212,191,0.6)" />
      <rect x="20" y="18" width="8" height="24" rx="2" fill="rgba(45,212,191,0.8)" />
      <rect x="34" y="8" width="8" height="34" rx="2" fill="#2dd4bf" />
      <path d="M8 12L22 8L38 4" stroke="rgba(45,212,191,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  ),
  "ppor-vs-rent": (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="16" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" />
      <path d="M24 8V40" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
      <path d="M16 14L16 34" stroke="rgba(148,163,184,0.25)" strokeWidth="6" strokeLinecap="round" />
      <path d="M32 18L32 30" stroke="rgba(148,163,184,0.25)" strokeWidth="6" strokeLinecap="round" />
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
  const inner = (
    <div className={`home-card ${tool.active ? "home-card--active" : "home-card--inactive"}`}>
      <div className="home-card-strip" />
      <div className="home-card-shine" />

      <div className="home-card-icon">
        {icons[tool.id]}
      </div>

      <h2 className="home-card-title">{tool.title}</h2>

      <span className={`home-card-badge ${
        tool.badge === "Beta" ? "home-card-badge--beta"
        : tool.active ? "home-card-badge--live"
        : "home-card-badge--soon"
      }`}>
        {tool.badge ?? (tool.active ? "Live" : "Soon")}
      </span>
    </div>
  );

  if (tool.active) {
    return <Link href={`/${tool.id}`} className="home-card-link">{inner}</Link>;
  }

  return inner;
}

/* ── Page ──────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="home-wrap">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-brand">
          <div className="home-header-logo">M</div>
          <span className="home-header-name">Mortgage Modeler</span>
        </div>
      </header>

      {/* Hero + Cards */}
      <main className="home-hero">
        <div className="home-glow" />

        <h1 className="home-title">Model property decisions with precision.</h1>

        <div className="home-cards-center">
          <div className="home-featured">
            {TOOLS.filter((t) => t.active).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          <div className="home-upcoming-label">Coming soon</div>

          <div className="home-cards">
            {TOOLS.filter((t) => !t.active).map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <span className="home-footer-brand">Mortgage Modeler</span>
          <span className="home-footer-sep">&middot;</span>
          <span>Daily compounding</span>
          <span className="home-footer-sep">&middot;</span>
          <span>AUD</span>
        </div>
      </footer>
    </div>
  );
}
