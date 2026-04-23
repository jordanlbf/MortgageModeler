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
        background: "var(--color-surface-sidebar)",
      }}
    >
      <Link
        href="/"
        className="flex items-center gap-2 px-4 pt-5 pb-4 transition-opacity hover:opacity-85"
      >
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-[4px] text-[10px] font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-brand), color-mix(in srgb, var(--color-brand) 70%, black))",
            color: "var(--color-brand-contrast)",
          }}
        >
          M
        </span>
        <span
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: "var(--color-fg-primary)" }}
        >
          MortgageModeler
        </span>
        <span
          className="ml-auto text-[9px] tracking-[0.03em]"
          style={{ color: "var(--color-fg-tertiary)" }}
        >
          v0.8
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

      <div className="px-3 pb-5 flex flex-col gap-0.5">
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
        className={`text-[9px] font-medium uppercase tracking-[0.1em] px-3 ${
          firstSection ? "mt-2 mb-1.5" : "mt-5 mb-1.5"
        }`}
        style={{ color: "var(--color-fg-tertiary)" }}
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
  const isUtility = variant === "utility";

  const textColor = isActive
    ? "var(--color-fg-primary)"
    : isUtility
    ? "var(--color-fg-tertiary)"
    : "var(--color-fg-secondary)";

  const iconColor = isActive
    ? "var(--color-brand)"
    : isUtility
    ? "var(--color-fg-tertiary)"
    : "var(--color-fg-secondary)";

  const height = isUtility
    ? "var(--layout-nav-item-utility-height)"
    : "var(--layout-nav-item-height)";

  const iconSize = isUtility ? 12 : 14;
  const fontSize = isUtility ? "text-[11.5px]" : "text-[13px]";
  const fontWeight = isActive ? "font-medium" : "font-normal";

  return (
    <Link
      href={href}
      className={`sb-nav-item ${isActive ? "sb-nav-item--active" : ""} flex items-center gap-2.5 px-3 rounded-lg ${fontSize} ${fontWeight} transition-colors hover:bg-[color-mix(in_srgb,var(--color-fg-primary)_4%,transparent)]`}
      style={{
        height,
        color: textColor,
      }}
    >
      <Icon
        size={iconSize}
        strokeWidth={1.5}
        style={{ color: iconColor }}
        className="shrink-0 transition-colors"
      />
      <span>{label}</span>
    </Link>
  );
}
