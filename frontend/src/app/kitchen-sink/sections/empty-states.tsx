import { AlertCircle, Home, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/patterns/EmptyState";
import VariantRow from "../_components/VariantRow";

export default function EmptyStatesSection() {
  return (
    <VariantRow label="EmptyState · no data / no results / error / coming soon">
      <EmptyState
        className="w-full max-w-[300px]"
        icon={<Home className="size-5" aria-hidden="true" />}
        title="No properties yet"
        body="Add your first property to model its cashflow."
        action={<Button size="sm">Add property</Button>}
      />
      <EmptyState
        className="w-full max-w-[300px]"
        icon={<SearchX className="size-5" aria-hidden="true" />}
        title="No grants match"
        body="Nothing for VIC, new build, over $1,234,567. Try widening the filters."
        action={<Button variant="outline" size="sm">Clear filters</Button>}
      />
      <EmptyState
        className="w-full max-w-[300px]"
        tone="error"
        icon={<AlertCircle className="size-5" aria-hidden="true" />}
        title="Couldn't load the schedule"
        body="The calculator didn't respond. Check your connection and try again."
        action={<Button variant="outline" size="sm">Retry</Button>}
      />
      <EmptyState
        className="w-full max-w-[300px]"
        icon={<Badge variant="tag">Soon</Badge>}
        title="Scenario comparison"
        body="Compare up to five scenarios side by side."
      />
    </VariantRow>
  );
}
