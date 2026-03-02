import { useState, useRef, useCallback } from "react";

interface EditableValueProps {
  display: string;
  onCommit: (raw: number) => void;
  parse: (display: string) => number;
  className?: string;
}

export default function EditableValue({ display, onCommit, parse, className = "" }: EditableValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (editing) return;
    setEditing(true);
    const seed = parse(display);
    setDraft(seed.toLocaleString("en-AU", { maximumFractionDigits: 2 }));
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const commit = useCallback(() => {
    if (!editing) return;
    setEditing(false);
    const stripped = draft.replace(/[^0-9.\-]/g, "");
    const parsed = Number(stripped);
    if (!isNaN(parsed) && stripped.length > 0 && parsed > 0) {
      onCommit(parsed);
    }
  }, [draft, onCommit, editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur(); }
    if (e.key === "Escape") { e.preventDefault(); setEditing(false); }
    const allowed = /^[0-9.,\-]$/.test(e.key) ||
      ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"].includes(e.key) ||
      e.metaKey || e.ctrlKey;
    if (!allowed) e.preventDefault();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={editing ? "decimal" : "none"}
      value={editing ? draft : display}
      readOnly={!editing}
      onClick={handleClick}
      onFocus={handleClick}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9.,-]/g, ""))}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={`bg-transparent outline-none caret-teal-400 selection:bg-teal-400/20 selection:text-zinc-50 cursor-text hover:text-teal-300 transition-colors duration-150 ${className}`}
    />
  );
}
