import { AlertCircle, Home, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import VariantRow from "../components/VariantRow";

/** Empty-state pattern: icon, one-line title, short reason, optional action. */
function EmptyState({ icon, title, body, action, tone }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode; tone?: "error" }) {
  return (
    <Card variant="panel" className="flex w-full max-w-[300px] flex-col items-center gap-2 rounded-2xl px-6 py-8 text-center">
      <span className={`mb-1 flex size-10 items-center justify-center rounded-full ${tone === "error" ? "bg-status-error-bg text-data-negative" : "bg-surface-hover text-fg-tertiary"}`}>
        {icon}
      </span>
      <span className="text-[15px] font-semibold">{title}</span>
      <span className="text-[13px] text-fg-tertiary">{body}</span>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

export default function EmptyStatesSection() {
  return (
    <VariantRow label="no data · no results · error · coming soon">
      <EmptyState
        icon={<Home className="size-5" aria-hidden="true" />}
        title="No properties yet"
        body="Add your first property to model its cashflow."
        action={<Button size="sm">Add property</Button>}
      />
      <EmptyState
        icon={<SearchX className="size-5" aria-hidden="true" />}
        title="No grants match"
        body="Nothing for VIC, new build, over $1,234,567. Try widening the filters."
        action={<Button variant="outline" size="sm">Clear filters</Button>}
      />
      <EmptyState
        tone="error"
        icon={<AlertCircle className="size-5" aria-hidden="true" />}
        title="Couldn't load the schedule"
        body="The calculator didn't respond. Check your connection and try again."
        action={<Button variant="outline" size="sm">Retry</Button>}
      />
      <EmptyState
        icon={<Badge variant="tag">Soon</Badge>}
        title="Scenario comparison"
        body="Compare up to five scenarios side by side."
      />
    </VariantRow>
  );
}
