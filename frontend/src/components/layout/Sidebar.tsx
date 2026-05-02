"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  Calculator,
  Receipt,
  LineChart,
  Landmark,
  Settings,
  HelpCircle,
  LogIn,
  LogOut,
  Plus,
  Home,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

/* ─────────────────────────────────────────────────────────────────────────────
 * Types & Data
 * ───────────────────────────────────────────────────────────────────────────── */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface RecentProperty {
  id: string;
  address: string;
  suburb: string;
  type: "investment" | "ppor";
  lastEdited: string;
  status: "draft" | "complete";
  cashflow?: number;
  equity?: number;
}

const TOOLS_NAV: NavItem[] = [
  { href: "/cashflow", label: "Cashflow", icon: LineChart },
  { href: "/amortisation", label: "Amortisation", icon: Coins },
  { href: "/tax", label: "Tax Calculator", icon: Calculator },
  { href: "/purchase-costs", label: "Purchase Costs", icon: Receipt },
  { href: "/grants", label: "Government Grants", icon: Landmark },
];

// TODO: Replace with real data from state/API
const MOCK_PROPERTIES: RecentProperty[] = [
  { id: "1", address: "42 Smith Street", suburb: "Sydney NSW", type: "investment", lastEdited: "2h ago", status: "complete", cashflow: 12400, equity: 185000 },
  { id: "2", address: "15 Beach Road", suburb: "Gold Coast QLD", type: "ppor", lastEdited: "Yesterday", status: "draft", equity: 95000 },
  { id: "3", address: "8/120 Collins St", suburb: "Melbourne VIC", type: "investment", lastEdited: "3 days ago", status: "complete", cashflow: -2100, equity: 62000 },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Sidebar Component
 * ───────────────────────────────────────────────────────────────────────────── */

export default function Sidebar() {
  const pathname = usePathname();
  const totalCashflow = MOCK_PROPERTIES.reduce((sum, p) => sum + (p.cashflow ?? 0), 0);

  return (
    <aside
      className="flex flex-col shrink-0 h-screen sticky top-0"
      style={{
        width: "var(--layout-sidebar-width)",
        background: "var(--color-card)",
        borderRight: "1px solid var(--color-border-default)",
      }}
    >
      {/* Logo + New Analysis */}
      <div className="px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold bg-[var(--color-brand)] text-[var(--color-brand-contrast)] transition-transform group-hover:scale-105">
            M
          </span>
          <span className="font-semibold text-[var(--color-fg-primary)] text-[14px]">Modeler</span>
        </Link>
        <Link
          href="/cashflow"
          className="p-2 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-[var(--color-brand-contrast)] transition-all hover:scale-105"
          title="New analysis"
        >
          <Plus size={14} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Portfolio Cashflow Summary */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-raised)]">
          <span className="text-[11px] text-[var(--color-fg-muted)]">Portfolio Cashflow</span>
          <span className={`text-sm font-semibold tabular-nums ${totalCashflow >= 0 ? "text-[var(--color-data-positive)]" : "text-[var(--color-data-negative)]"}`}>
            {totalCashflow >= 0 ? "+" : ""}{(totalCashflow / 1000).toFixed(1)}k
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {/* Properties Section */}
        <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
          Properties
        </p>
        <div className="space-y-0.5">
          {MOCK_PROPERTIES.map((property) => (
            <PropertyRow key={property.id} property={property} />
          ))}
        </div>

        {/* Tools Section */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
          <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
            Tools
          </p>
          <div className="space-y-0.5">
            {TOOLS_NAV.map((item) => (
              <NavItemRow key={item.href} {...item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <SidebarFooter />
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Property Row
 * ───────────────────────────────────────────────────────────────────────────── */

function PropertyRow({ property }: { property: RecentProperty }) {
  const Icon = property.type === "investment" ? Building2 : Home;
  const isPositive = (property.cashflow ?? 0) >= 0;

  return (
    <Link
      href={`/cashflow?id=${property.id}`}
      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
    >
      <div className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 ${
        property.type === "investment" 
          ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" 
          : "bg-[var(--color-surface-hover)] text-[var(--color-fg-muted)]"
      }`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--color-fg-primary)] truncate">{property.address}</p>
      </div>
      {property.cashflow !== undefined && (
        <span className={`text-[11px] font-medium tabular-nums shrink-0 ${
          isPositive ? "text-[var(--color-data-positive)]" : "text-[var(--color-data-negative)]"
        }`}>
          {isPositive ? "+" : ""}{(property.cashflow / 1000).toFixed(1)}k
        </span>
      )}
      {property.status === "draft" && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Draft" />
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Nav Item Row
 * ───────────────────────────────────────────────────────────────────────────── */

function NavItemRow({ href, label, icon: Icon, pathname }: NavItem & { pathname: string | null }) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
        isActive 
          ? "bg-[var(--color-surface-active)] text-[var(--color-fg-primary)]" 
          : "text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-subtle)]"
      }`}
    >
      <Icon size={15} strokeWidth={1.75} className={isActive ? "text-[var(--color-brand)]" : "text-[var(--color-fg-muted)]"} />
      {label}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Footer
 * ───────────────────────────────────────────────────────────────────────────── */

function SidebarFooter() {
  const { user, status, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await logout();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-[var(--color-border-subtle)]">
      {/* Account */}
      {status === "authenticated" && user ? (
        <div className="px-4 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-fg-muted)] text-[11px] font-medium flex items-center justify-center">
            {(user.email ?? "?")[0].toUpperCase()}
          </div>
          <span className="flex-1 text-[12px] text-[var(--color-fg-secondary)] truncate">{user.email}</span>
          <button
            onClick={handleLogout}
            disabled={submitting}
            className="p-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg-secondary)] disabled:opacity-50 transition-colors"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      ) : status === "anonymous" ? (
        <div className="px-4 py-3">
          <Link href="/login" className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] transition-colors">
            <LogIn size={13} />
            Sign in
          </Link>
        </div>
      ) : (
        <div className="h-[52px]" aria-hidden="true" />
      )}

      {/* Utility links */}
      <div className="px-4 py-2 flex gap-1 border-t border-[var(--color-border-subtle)]">
        <Link
          href="#"
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
        >
          <Settings size={12} />
          Settings
        </Link>
        <Link
          href="#"
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
        >
          <HelpCircle size={12} />
          Help
        </Link>
      </div>
    </div>
  );
}
