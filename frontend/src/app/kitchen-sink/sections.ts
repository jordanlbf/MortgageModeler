import type { ComponentType } from "react";
import AlertsSection from "./sections/alerts";
import BadgesSection from "./sections/badges";
import ButtonsSection from "./sections/buttons";
import CalculatorSection from "./sections/calculator";
import CardVariantsSection from "./sections/card-variants";
import CardsSection from "./sections/cards";
import ColorsSection from "./sections/colors";
import DashboardSection from "./sections/dashboard";
import EmptyStatesSection from "./sections/empty-states";
import InputsSection from "./sections/inputs";
import KpiCardsSection from "./sections/kpi-cards";
import ListsSection from "./sections/lists";
import LoadingStatesSection from "./sections/loading-states";
import NumbersSection from "./sections/numbers";
import OverlaysSection from "./sections/overlays";
import SelectsAndTogglesSection from "./sections/selects-and-toggles";
import TablesSection from "./sections/tables";
import TitlesSection from "./sections/titles";
import TypographySection from "./sections/typography";

export interface Section {
  /** Anchor id: /kitchen-sink[/<layer>]#<id>. Unique across all pages. */
  id: string;
  title: string;
  Component: ComponentType;
}

export type LayerKey = "foundations" | "primitives" | "blocks" | "cards" | "layouts";

export interface SinkPageDef {
  key: LayerKey;
  href: string;
  title: string;
  /** One line under the switcher: what the layer is and where to edit it. */
  summary: string;
  sections: Section[];
}

/*
 * Five layers, each built only from the ones before it:
 * foundations (tokens) → primitives (components/ui) → blocks → cards → layouts
 * (components/patterns/{blocks,cards,layouts}).
 */

export const FOUNDATIONS: Section[] = [
  { id: "typography", title: "Typography", Component: TypographySection },
  { id: "colors", title: "Colors", Component: ColorsSection },
];

export const PRIMITIVES: Section[] = [
  { id: "buttons", title: "Buttons", Component: ButtonsSection },
  { id: "inputs", title: "Inputs", Component: InputsSection },
  { id: "selects-and-toggles", title: "Selects and toggles", Component: SelectsAndTogglesSection },
  { id: "badges", title: "Badges and tags", Component: BadgesSection },
  { id: "card-variants", title: "Card surfaces", Component: CardVariantsSection },
  { id: "tables", title: "Tables", Component: TablesSection },
  { id: "overlays", title: "Overlays", Component: OverlaysSection },
  { id: "loading-states", title: "Loading states", Component: LoadingStatesSection },
];

export const BLOCKS: Section[] = [
  { id: "titles", title: "Titles and captions", Component: TitlesSection },
  { id: "numbers", title: "Numbers", Component: NumbersSection },
  { id: "lists", title: "Lists", Component: ListsSection },
  { id: "alerts", title: "Alerts and banners", Component: AlertsSection },
];

export const CARDS: Section[] = [
  { id: "cards", title: "Section cards", Component: CardsSection },
  { id: "kpi-cards", title: "KPI cards", Component: KpiCardsSection },
  { id: "empty-states", title: "Empty states", Component: EmptyStatesSection },
];

export const LAYOUTS: Section[] = [
  { id: "calculator", title: "Calculator", Component: CalculatorSection },
  { id: "dashboard", title: "Dashboard", Component: DashboardSection },
];

export const PAGES: SinkPageDef[] = [
  { key: "foundations", href: "/kitchen-sink", title: "Foundations", summary: "Tokens: type, colour, surfaces. Edit src/app/globals.css.", sections: FOUNDATIONS },
  { key: "primitives", href: "/kitchen-sink/primitives", title: "Primitives", summary: "shadcn controls and their variants. Edit src/components/ui/*.", sections: PRIMITIVES },
  { key: "blocks", href: "/kitchen-sink/blocks", title: "Blocks", summary: "Pieces that sit inside a card. Edit src/components/patterns/blocks/*.", sections: BLOCKS },
  { key: "cards", href: "/kitchen-sink/cards", title: "Cards", summary: "Blocks in a box. Edit src/components/patterns/cards/*.", sections: CARDS },
  { key: "layouts", href: "/kitchen-sink/layouts", title: "Layouts", summary: "Whole-page arrangements of cards. Edit src/components/patterns/layouts/*.", sections: LAYOUTS },
];

/** Every section on every page. */
export const SECTIONS: Section[] = PAGES.flatMap((p) => p.sections);
