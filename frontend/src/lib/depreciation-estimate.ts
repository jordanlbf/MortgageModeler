/**
 * Generates realistic depreciation schedules from property price.
 *
 * Two asset types:
 * - Division 43 (building): construction cost ~50% of property price, 2.5% rate (post-1987)
 * - Division 40 (plant/equipment): 5-8 synthetic assets with ATO-standard effective lives
 *
 * Accounts for new vs existing properties and years already elapsed.
 */

export interface EstimatedBuilding {
  name: string;
  construction_cost: number;
  purchase_date: string; // ISO date
  construction_start_date: string; // ISO date
}

export interface EstimatedAsset {
  name: string;
  cost: number;
  effective_life_years: number;
  purchase_date: string; // ISO date
  method: "diminishing_value" | "prime_cost";
  written_down_value: number;
}

// Typical plant/equipment items with ATO effective lives
const ASSET_TEMPLATES = [
  { name: "Air conditioning",   basePct: 0.025, life: 10 },
  { name: "Carpet",             basePct: 0.015, life: 8  },
  { name: "Blinds & curtains",  basePct: 0.008, life: 6  },
  { name: "Hot water system",   basePct: 0.010, life: 12 },
  { name: "Dishwasher",         basePct: 0.005, life: 8  },
  { name: "Cooktop & oven",     basePct: 0.008, life: 12 },
  { name: "Light fittings",     basePct: 0.006, life: 5  },
  { name: "Smoke detectors",    basePct: 0.002, life: 6  },
];

// Seeded random for deterministic variation based on property price
function seededVariation(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 4973) * 10000;
  return (x - Math.floor(x)) * 0.3 - 0.15; // ±15%
}

function roundTo50(value: number): number {
  return Math.round(value / 50) * 50;
}

export function generateDepreciationEstimate(
  propertyPrice: number,
  isNewProperty: boolean,
  purchaseYear: number,
): { buildings: EstimatedBuilding[]; assets: EstimatedAsset[] } {
  const currentYear = new Date().getFullYear();
  const yearsElapsed = Math.max(0, currentYear - purchaseYear);
  const purchaseDate = `${purchaseYear}-07-01`;

  // Division 43 — building
  const constructionPct = isNewProperty ? 0.55 : 0.45;
  const constructionCost = roundTo50(propertyPrice * constructionPct);
  // Assume construction started 2 years before purchase
  const constructionStartYear = purchaseYear - 2;

  const buildings: EstimatedBuilding[] = [
    {
      name: "Building structure",
      construction_cost: constructionCost,
      purchase_date: purchaseDate,
      construction_start_date: `${constructionStartYear}-01-01`,
    },
  ];

  // Division 40 — plant & equipment
  // New properties have higher asset values (brand new fixtures)
  const assetMultiplier = isNewProperty ? 1.3 : 0.8;
  const seed = propertyPrice;

  const assets: EstimatedAsset[] = ASSET_TEMPLATES.map((template, i) => {
    const variation = seededVariation(seed, i);
    const baseCost = roundTo50(propertyPrice * template.basePct * assetMultiplier * (1 + variation));

    // For existing properties, calculate written-down value using diminishing value method
    let writtenDownValue = baseCost;
    if (yearsElapsed > 0) {
      const rate = 2 / template.life; // diminishing value rate
      for (let y = 0; y < yearsElapsed; y++) {
        writtenDownValue *= (1 - rate);
      }
      writtenDownValue = roundTo50(Math.max(0, writtenDownValue));
    }

    return {
      name: template.name,
      cost: baseCost,
      effective_life_years: template.life,
      purchase_date: purchaseDate,
      method: "diminishing_value" as const,
      // For new properties (yearsElapsed === 0) writtenDownValue === baseCost;
      // for existing it's the diminished value computed above. Either way the
      // backend's diminishing-value formula uses this as the base, so sending
      // 0 here would zero out every year's Div 40 depreciation.
      written_down_value: writtenDownValue,
    };
  });

  return { buildings, assets };
}

/**
 * Estimate the first-year annual depreciation for display purposes.
 */
export function estimateAnnualDepreciation(
  propertyPrice: number,
  isNewProperty: boolean,
  purchaseYear: number,
): number {
  const { buildings, assets } = generateDepreciationEstimate(propertyPrice, isNewProperty, purchaseYear);
  const currentYear = new Date().getFullYear();
  const yearsElapsed = Math.max(0, currentYear - purchaseYear);

  // Div 43: 2.5% of construction cost (capped at 40 years)
  const div43 = yearsElapsed < 40
    ? buildings.reduce((sum, b) => sum + b.construction_cost * 0.025, 0)
    : 0;

  // Div 40: diminishing value for each asset
  const div40 = assets.reduce((sum, a) => {
    const baseValue = yearsElapsed > 0 ? a.written_down_value : a.cost;
    if (baseValue <= 0) return sum;
    const rate = 2 / a.effective_life_years;
    return sum + baseValue * rate;
  }, 0);

  return Math.round(div43 + div40);
}
