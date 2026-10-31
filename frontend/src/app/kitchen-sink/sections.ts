import type { ComponentType } from "react";
import AlertsSection from "./sections/alerts";
import BadgesSection from "./sections/badges";
import ButtonsSection from "./sections/buttons";
import CardVariantsSection from "./sections/card-variants";
import CardsSection from "./sections/cards";
import ColorsSection from "./sections/colors";
import EmptyStatesSection from "./sections/empty-states";
import ExamplePageSection from "./sections/example-page";
import InputsSection from "./sections/inputs";
import ListsSection from "./sections/lists";
import LoadingStatesSection from "./sections/loading-states";
import OverlaysSection from "./sections/overlays";
import SelectsAndTogglesSection from "./sections/selects-and-toggles";
import StatsSection from "./sections/stats";
import TablesSection from "./sections/tables";
import TypographySection from "./sections/typography";

export interface Section {
  /** Anchor id: /kitchen-sink[/components]#<id>. Unique across both pages. */
  id: string;
  title: string;
  Component: ComponentType;
}

export interface SinkPageDef {
  key: "primitives" | "components";
  href: string;
  title: string;
  sections: Section[];
}

/** Primitives: the shadcn controls and tokens in components/ui and globals.css. */
export const PRIMITIVES: Section[] = [
  { id: "typography", title: "Typography", Component: TypographySection },
  { id: "colors", title: "Colors", Component: ColorsSection },
  { id: "buttons", title: "Buttons", Component: ButtonsSection },
  { id: "inputs", title: "Inputs", Component: InputsSection },
  { id: "selects-and-toggles", title: "Selects and toggles", Component: SelectsAndTogglesSection },
  { id: "badges", title: "Badges and tags", Component: BadgesSection },
  { id: "card-variants", title: "Card variants", Component: CardVariantsSection },
  { id: "tables", title: "Tables", Component: TablesSection },
  { id: "overlays", title: "Overlays", Component: OverlaysSection },
  { id: "loading-states", title: "Loading states", Component: LoadingStatesSection },
];

/** Components: the shared patterns in components/patterns, built from the primitives. */
export const COMPONENTS: Section[] = [
  { id: "cards", title: "Cards", Component: CardsSection },
  { id: "stats", title: "Numbers and KPIs", Component: StatsSection },
  { id: "lists", title: "Lists", Component: ListsSection },
  { id: "alerts", title: "Alerts and banners", Component: AlertsSection },
  { id: "empty-states", title: "Empty states", Component: EmptyStatesSection },
  { id: "example-page", title: "Example page", Component: ExamplePageSection },
];

export const PAGES: SinkPageDef[] = [
  { key: "primitives", href: "/kitchen-sink", title: "Primitives", sections: PRIMITIVES },
  { key: "components", href: "/kitchen-sink/components", title: "Components", sections: COMPONENTS },
];

/** Every section on both pages. */
export const SECTIONS: Section[] = [...PRIMITIVES, ...COMPONENTS];
