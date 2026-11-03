import SinkPage from "./_components/SinkPage";
import { PAGES } from "./sections";

/**
 * Internal design-system gallery, in five layers (Foundations → Primitives →
 * Blocks → Cards → Layouts), one page each; this is Foundations. Gated in
 * production by src/proxy.ts; see docs/KITCHEN_SINK.md.
 */
export default function KitchenSinkPage() {
  return <SinkPage page={PAGES[0]} />;
}
