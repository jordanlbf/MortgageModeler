import type { ComponentType } from "react";
import BadgesSection from "./sections/badges";
import ButtonsSection from "./sections/buttons";
import ColorsSection from "./sections/colors";
import EmptyStatesSection from "./sections/empty-states";
import FeedbackSection from "./sections/feedback";
import InputsSection from "./sections/inputs";
import KpisSection from "./sections/kpis";
import LoadingStatesSection from "./sections/loading-states";
import SelectsAndTogglesSection from "./sections/selects-and-toggles";
import TablesSection from "./sections/tables";
import TypographySection from "./sections/typography";

export interface Section {
  /** Anchor id: /kitchen-sink#<id>. */
  id: string;
  title: string;
  Component: ComponentType;
}

/** Every section, in page order. Add new design-system primitives to the matching section. */
export const SECTIONS: Section[] = [
  { id: "typography", title: "Typography", Component: TypographySection },
  { id: "colors", title: "Colors", Component: ColorsSection },
  { id: "buttons", title: "Buttons", Component: ButtonsSection },
  { id: "inputs", title: "Inputs", Component: InputsSection },
  { id: "selects-and-toggles", title: "Selects and toggles", Component: SelectsAndTogglesSection },
  { id: "kpis", title: "KPI cards", Component: KpisSection },
  { id: "tables", title: "Tables", Component: TablesSection },
  { id: "badges", title: "Badges and tags", Component: BadgesSection },
  { id: "feedback", title: "Feedback", Component: FeedbackSection },
  { id: "empty-states", title: "Empty states", Component: EmptyStatesSection },
  { id: "loading-states", title: "Loading states", Component: LoadingStatesSection },
];
