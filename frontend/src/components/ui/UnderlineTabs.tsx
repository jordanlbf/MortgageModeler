"use client";

interface Tab {
  key: string;
  label: string;
  hint?: string;
}

interface Props {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function UnderlineTabs({ tabs, activeKey, onChange }: Props) {
  return (
    <div className="flex gap-5 border-b border-[color:var(--color-border-subtle)]">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`relative py-2.5 text-[13px] font-medium tracking-tight transition-colors ${
              active ? "text-fg-primary" : "text-fg-tertiary hover:text-fg-secondary"
            }`}
          >
            {tab.label}
            {tab.hint && (
              <span className="ml-1.5 text-[11px] font-normal text-fg-tertiary">{tab.hint}</span>
            )}
            {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-hover" />}
          </button>
        );
      })}
    </div>
  );
}
