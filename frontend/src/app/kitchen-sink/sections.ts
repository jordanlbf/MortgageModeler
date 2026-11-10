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
import { AmortisationScreenSection, CashflowOutputScreenSection, CashflowWizardScreenSection, GrantsScreenSection, PurchaseCostsScreenSection, TaxScreenSection } from "./sections/screens";
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

export type LayerKey = "foundations" | "primitives" | "blocks" | "cards" | "layouts" | "screens";

export interface SinkPageDef {
  key: LayerKey;
  href: string;
  title: string;
  /** One line under the switcher: what the layer is and where to edit it. */
  summary: string;
  sections: Section[];
}

/*
 * Six layers, each built only from the ones before it:
 * foundations (tokens) → primitives (components/ui) → blocks → cards → layouts
 * (components/patterns/{blocks,cards,layouts}) → screens (the polished
 * feature screens themselves, on sample data).
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

export const SCREENS: Section[] = [
  { id: "screen-cashflow-wizard", title: "Cashflow · wizard", Component: CashflowWizardScreenSection },
  { id: "screen-cashflow-output", title: "Cashflow · output", Component: CashflowOutputScreenSection },
  { id: "screen-purchase-costs", title: "Purchase Costs · calculator", Component: PurchaseCostsScreenSection },
  { id: "screen-tax", title: "Tax · calculator", Component: TaxScreenSection },
  { id: "screen-amortisation", title: "Amortisation · calculator", Component: AmortisationScreenSection },
  { id: "screen-grants", title: "Government Grants · calculator", Component: GrantsScreenSection },
];

export const PAGES: SinkPageDef[] = [
  { key: "foundations", href: "/kitchen-sink", title: "Foundations", summary: "Tokens: type, colour, surfaces. Edit src/app/globals.css.", sections: FOUNDATIONS },
  { key: "primitives", href: "/kitchen-sink/primitives", title: "Primitives", summary: "shadcn controls and their variants. Edit src/components/ui/*.", sections: PRIMITIVES },
  { key: "blocks", href: "/kitchen-sink/blocks", title: "Blocks", summary: "Pieces that sit inside a card. Edit src/components/patterns/blocks/*.", sections: BLOCKS },
  { key: "cards", href: "/kitchen-sink/cards", title: "Cards", summary: "Blocks in a box. Edit src/components/patterns/cards/*.", sections: CARDS },
  { key: "layouts", href: "/kitchen-sink/layouts", title: "Layouts", summary: "Whole-page arrangements of cards. Edit src/components/patterns/layouts/*.", sections: LAYOUTS },
  { key: "screens", href: "/kitchen-sink/screens", title: "Screens", summary: "The polished screens (Cashflow, Purchase Costs, Tax, Amortisation, Grants) rendered by the app's own components on generic sample data. Edit src/components/{cashflow,purchase-costs,tax,amortisation,grants} or the layers below.", sections: SCREENS },
];

/** Every section on every page. */
export const SECTIONS: Section[] = PAGES.flatMap((p) => p.sections);
