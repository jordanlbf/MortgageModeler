import Link from "next/link";
import { t } from "@/lib/theme";
import ThemeToggle from "@/components/layout/ThemeToggle";

interface HeaderProps {
  children?: React.ReactNode;
}

export default function Header({ children }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-7 py-3"
      style={{ borderBottom: `1px solid ${t.border.default}` }}
    >
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div
          className="header-logo flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold text-accent-contrast"
          style={{ background: t.accent }}
        >
          M
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-muted/75">
          MortgageModeler
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
