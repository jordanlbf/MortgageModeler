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
      className="flex flex-col shrink-0"
      style={{
        width: "var(--layout-sidebar-width)",
        background: "var(--color-surface-page)",
      }}
    >
      <Link
        href="/"
        className="block px-6 py-6 transition-opacity hover:opacity-85"
      >
        <span
          className="text-[15px] font-semibold tracking-tight"
          style={{ color: "var(--color-foreground)" }}
        >
          MortgageModeler
        </span>
      </Link>

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

      <div className="flex-1" />

      <div className="px-3 pb-4 flex flex-col gap-0.5">
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
    <div className="px-3 flex flex-col">
      <div
        className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-3 ${
          firstSection ? "mt-2 mb-2" : "mt-6 mb-2"
        }`}
        style={{ color: "var(--color-faint)" }}
      >
        {header}
      </div>
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

  const bgStyle: React.CSSProperties = isActive
    ? { background: "color-mix(in srgb, var(--color-accent) 10%, transparent)" }
    : {};

  const textColor = isActive
    ? "var(--color-foreground)"
    : variant === "utility"
    ? "var(--color-faint)"
    : "var(--color-subtle)";

  const iconColor = isActive
    ? "var(--color-accent)"
    : variant === "utility"
    ? "var(--color-faint)"
    : "var(--color-subtle)";

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 rounded-lg text-[14px] font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--color-foreground)_4%,transparent)]"
      style={{
        ...bgStyle,
        height: "var(--layout-nav-item-height)",
        color: textColor,
      }}
    >
      <Icon
        size={16}
        strokeWidth={1.5}
        style={{ color: iconColor }}
        className="shrink-0 transition-colors"
      />
      <span>{label}</span>
    </Link>
  );
}
