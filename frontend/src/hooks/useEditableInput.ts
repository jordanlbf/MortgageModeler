import { useState, useRef, useCallback } from "react";

interface UseEditableInputOptions {
  display: string;
  onCommit: (parsed: number) => void;
  parse: (display: string) => number;
}

export function useEditableInput({ display, onCommit, parse }: UseEditableInputOptions) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value.replace(/[^0-9.,-]/g, ""));
  };

  return {
    editing,
    draft,
    inputRef,
    startEditing,
    commit,
    handleKeyDown,
    handleChange,
  };
}
