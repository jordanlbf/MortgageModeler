"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coins,
  Calculator,
  Receipt,
  LineChart,
  Landmark,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const DASHBOARD_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

const TOOLS_NAV: NavItem[] = [
  { href: "/amortisation", label: "Amortisation", icon: Coins },
  { href: "/tax", label: "Tax Calculator", icon: Calculator },
  { href: "/purchase-costs", label: "Purchase Costs", icon: Receipt },
  { href: "/cashflow", label: "Cashflow", icon: LineChart },
  { href: "/grants", label: "Government Grants", icon: Landmark },
];

const UTILITY_NAV: NavItem[] = [
  { href: "#", label: "Settings", icon: Settings },
  { href: "#", label: "Help", icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col shrink-0 h-screen sticky top-0"
      style={{
        width: "var(--layout-sidebar-width)",
        background: "var(--color-card)",
        borderRight: "1px solid var(--color-border-default)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-4 transition-opacity hover:opacity-85"
      >
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-sm font-bold shrink-0"
          style={{
            background: "var(--color-brand)",
            color: "var(--color-surface-page)",
          }}
        >
          M
        </span>
        <span
          className="font-semibold"
          style={{ color: "var(--color-fg-primary)" }}
        >
          MortgageModeler
        </span>
        <span
          className="ml-auto text-xs"
          style={{ color: "var(--color-fg-muted)" }}
        >
          v0.8
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <NavSection header="Dashboard" firstSection>
          {DASHBOARD_NAV.map((item) => (
            <NavItemRow key={item.href} {...item} pathname={pathname} />
          ))}
        </NavSection>

        <NavSection header="Tools">
          {TOOLS_NAV.map((item) => (
            <NavItemRow key={item.href} {...item} pathname={pathname} />
          ))}
        </NavSection>
      </nav>

      {/* Footer utilities */}
      <div
        className="px-3 py-4 flex flex-col gap-0.5"
        style={{ borderTop: "1px solid var(--color-border-default)" }}
      >
        {UTILITY_NAV.map((item) => (
          <NavItemRow
            key={item.label}
            {...item}
            pathname={pathname}
            variant="utility"
          />
        ))}
      </div>
    </aside>
  );
}

function NavSection({
  header,
  firstSection = false,
  children,
}: {
  header: string;
  firstSection?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={firstSection ? "mb-6" : ""}>
      <p
        className={`px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider ${
          firstSection ? "" : "mt-6"
        }`}
        style={{ color: "var(--color-fg-muted)" }}
      >
        {header}
      </p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function NavItemRow({
  href,
  label,
  icon: Icon,
  pathname,
  variant = "default",
}: NavItem & { pathname: string | null; variant?: "default" | "utility" }) {
  const isActive = variant === "default" && pathname === href;
  const isUtility = variant === "utility";

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors"
      style={{
        backgroundColor: isActive ? "var(--color-surface-active)" : "transparent",
        color: isActive
          ? "var(--color-fg-primary)"
          : isUtility
            ? "var(--color-fg-tertiary)"
            : "var(--color-fg-secondary)",
      }}
    >
      <Icon
        size={isUtility ? 14 : 16}
        strokeWidth={1.5}
        style={{
          color: isActive
            ? "var(--color-brand)"
            : "var(--color-fg-muted)"
        }}
        className="shrink-0"
      />
      <span>{label}</span>
    </Link>
  );
}