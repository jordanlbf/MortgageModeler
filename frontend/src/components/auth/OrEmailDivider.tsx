import { Separator } from "@/components/ui/separator";

interface Props {
  text?: string;
}

export default function OrEmailDivider({ text = "or email" }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Separator className="h-px flex-1 bg-border-default" />
      <span className="text-[12px] text-fg-tertiary">{text}</span>
      <Separator className="h-px flex-1 bg-border-default" />
    </div>
  );
}
