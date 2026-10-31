import SinkPage from "./_components/SinkPage";
import { PAGES } from "./sections";

/**
 * Internal component gallery, page 1: design-system primitives and their
 * variants. Components (shared patterns) are at /kitchen-sink/components.
 * Gated in production by src/proxy.ts; see docs/KITCHEN_SINK.md.
 */
export default function KitchenSinkPage() {
  return <SinkPage page={PAGES[0]} />;
}
