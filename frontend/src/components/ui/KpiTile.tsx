"use client";

interface Props {
  label: string;
  value: string;
  color?: string;
  divider?: boolean;
  children?: React.ReactNode;
}

export default function KpiTile({ label, value, color, divider, children }: Props) {
  const dividerCls = divider
    ? "before:content-[''] before:absolute before:left-0 before:top-[20%] before:bottom-[20%] before:w-px before:bg-border max-[768px]:before:hidden"
    : "";

  return (
    <div
      className={`flex-1 px-6 py-5 flex flex-col gap-2 text-center relative max-[768px]:flex-[1_1_50%] max-[768px]:min-w-[50%] ${dividerCls}`}
    >
      <div className="mb-1 text-[10px] font-medium tracking-[0.04em] uppercase text-fg-tertiary">{label}</div>
      <div className="kpi-val text-lg font-semibold tabular-nums tracking-tight leading-tight" style={{ color }}>
        {value}
      </div>
      {children}
    </div>
  );
}
