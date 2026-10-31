import SinkPage from "../_components/SinkPage";
import { PAGES } from "../sections";

/**
 * Internal component gallery, page 2: the shared patterns (cards, stats,
 * lists, alerts, empty states) with dummy content. Edit the pattern files in
 * src/components/patterns to restyle every page.
 */
export default function KitchenSinkComponentsPage() {
  return <SinkPage page={PAGES[1]} />;
}
