import { useEditableInput } from "@/hooks/useEditableInput";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableValueProps {
  display: string;
  onCommit: (raw: number) => void;
  parse: (display: string) => number;
  className?: string;
  /** Accessible name for the field (it has no visible label of its own). */
  label?: string;
}

/** Read-only value that turns into a text input on click/focus. */
export default function EditableValue({ display, onCommit, parse, className, label }: EditableValueProps) {
  const { editing, draft, inputRef, startEditing, commit, handleKeyDown, handleChange } =
    useEditableInput({ display, onCommit, parse });

  return (
    <Input
      ref={inputRef}
      variant="ghost"
      type="text"
      inputMode={editing ? "decimal" : "none"}
      value={editing ? draft : display}
      readOnly={!editing}
      aria-label={label}
      onClick={startEditing}
      onFocus={startEditing}
      onChange={handleChange}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={cn(
        "selection:bg-brand/20 selection:text-fg-primary cursor-text hover:text-brand/75 transition-colors duration-150",
        className,
      )}
    />
  );
}
