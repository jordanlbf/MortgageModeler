import { useEditableInput } from "@/hooks/useEditableInput";

interface EditableValueProps {
  display: string;
  onCommit: (raw: number) => void;
  parse: (display: string) => number;
  className?: string;
}

export default function EditableValue({ display, onCommit, parse, className = "" }: EditableValueProps) {
  const { editing, draft, inputRef, startEditing, commit, handleKeyDown, handleChange } =
    useEditableInput({ display, onCommit, parse });

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={editing ? "decimal" : "none"}
      value={editing ? draft : display}
      readOnly={!editing}
      onClick={startEditing}
      onFocus={startEditing}
      onChange={handleChange}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={`bg-transparent outline-none caret-accent selection:bg-brand/20 selection:text-fg-primary cursor-text hover:text-brand/75 transition-colors duration-150 ${className}`}
    />
  );
}
