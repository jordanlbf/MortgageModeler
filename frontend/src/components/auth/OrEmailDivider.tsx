interface Props {
  text?: string;
}

export default function OrEmailDivider({ text = "or email" }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: "var(--color-border-default)" }} />
      <span style={{ fontSize: 12, color: "var(--color-fg-tertiary)" }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: "var(--color-border-default)" }} />
    </div>
  );
}