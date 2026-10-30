# Installed shadcn/ui components

Import from `@/components/ui/<file>`. Each component keeps shadcn's stock variants (`default`, `outline`, `ghost`…) and adds the custom variants listed here. Custom variants carry no size classes. Per-instance colours go in CSS custom properties (e.g. `style={{ "--switch-accent": color }}`), not props.

| File | Exports | Custom variants |
|---|---|---|
| `badge` | `Badge`, `badgeVariants` | `count`, `stat` (`--badge-accent`), `tag`, `tinted` |
| `button` | `Button`, `buttonVariants` | `cta`, `cta-glow`, `outline-action`, `outline-subtle`, `outline-filled`, `outline-block`, `outline-icon`, `soft`, `ghost-muted`, `ghost-brand`, `ghost-icon`, `icon-filled`, `icon-brand`, `icon-quiet`, `icon-subtle`, `tinted-icon`, `link-back`, `link-back-footer`, `link-muted`, `link-subtle`, `link-quiet`, `chip`, `disclosure`, `disclosure-row`, `nav-item`, `nav-row`, `nav-utility`, `nav-step`, `legend-row` |
| `card` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` | `glass` (raised, rounded-2xl, hover lift), `panel` (rounded-xl, hairline border, card fill, no padding), `auth`, `scheme` |
| `checkbox` | `Checkbox` | `md`, `lg` |
| `collapsible` | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | none |
| `dialog` | `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose` | `bare` (no padding or close button) |
| `input` | `Input` | `filled`, `form`, `bar`, `ghost`, `underline` |
| `label` | `Label` | `field`, `form`, `caps`, `bare` |
| `native-select` | `NativeSelect`, `NativeSelectOption`, `NativeSelectOptGroup` | `form` |
| `popover` | `Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverContent`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription` | none |
| `progress` | `Progress` | `bar`, `meter` (`--progress-accent`) |
| `separator` | `Separator` | none |
| `sheet` | `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription` | `bare` |
| `skeleton` | `Skeleton` | `inline` |
| `slider` | `Slider` (extra prop `thumbProps`) | `accent` (hairline track, `--slider-accent`) |
| `switch` | `Switch` | `accent` (`--switch-accent`), `glow` |
| `table` | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` | `dense`, `bare` |
| `tabs` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants` | `underline`, `stat` (`--tab-accent`), `track` |
| `toggle` | `Toggle`, `ToggleLegendDot`, `toggleVariants` | `pill`, `choice`, `segment`, `segment-pill`, `solid`, `legend` (`--legend-accent`) |
| `toggle-group` | `ToggleGroup`, `ToggleGroupItem` | same as `toggle`, set on the group |
| `tooltip` | `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | `surface` (on `TooltipContent`) |

If v0 only has stock shadcn, use the closest stock variant and keep the rest of the styling in Tailwind classes with the tokens from `globals.css`.
