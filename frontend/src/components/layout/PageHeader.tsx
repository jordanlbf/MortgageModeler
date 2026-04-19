interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1
          className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em]"
          style={{ color: "var(--color-foreground)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-[14px] mt-2 tabular-nums"
            style={{ color: "var(--color-subtle)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
