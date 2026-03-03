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
      className={`bg-transparent outline-none caret-teal-400 selection:bg-teal-400/20 selection:text-zinc-50 cursor-text hover:text-teal-300 transition-colors duration-150 ${className}`}
    />
  );
}
