// npm run v0:export
//
// Packs the kitchen sink and everything it imports into a standalone Next.js
// app for v0: frontend/v0-export/ (folder) and frontend/v0-export.zip. Paths
// match the real app, so v0:import can copy v0's changes straight back.
// See docs/KITCHEN_SINK.md, "Iterating with v0".

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  CONFIG_FILES, DOC_FILES, EXPORT_DIR, EXPORT_ZIP, FRONTEND, MANIFEST,
  kitchenSinkFiles, sha, writeZip,
} from "./v0-lib.mjs";

const read = (rel) => fs.readFileSync(path.join(FRONTEND, rel));

const files = new Map();

// 1. The kitchen sink and everything it imports.
const sources = kitchenSinkFiles();
for (const rel of sources) files.set(rel, read(rel));

// 2. Config so it builds, and reference docs.
for (const rel of [...CONFIG_FILES, ...DOC_FILES]) {
  if (fs.existsSync(path.join(FRONTEND, rel))) files.set(rel, read(rel));
}

// 3. package.json: same dependencies, minus the test tooling.
const pkg = JSON.parse(read("package.json"));
const DROP = /^(@playwright|@testing-library|vitest|jsdom|axe-core|openapi-typescript)/;
pkg.name = "mortgagemodeler-kitchen-sink";
pkg.scripts = { dev: "next dev", build: "next build", start: "next start", lint: "eslint" };
pkg.devDependencies = Object.fromEntries(Object.entries(pkg.devDependencies ?? {}).filter(([k]) => !DROP.test(k)));
files.set("package.json", Buffer.from(JSON.stringify(pkg, null, 2) + "\n"));

// 4. A bare root layout (no login) and a home page that opens the kitchen sink.
files.set("src/app/layout.tsx", Buffer.from(`import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

// Export-only root layout: the real one also wraps the app in the login
// provider, which the kitchen sink doesn't need. Not copied back by v0:import.

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = { title: "MortgageModeler kitchen sink" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={\`\${sora.variable} font-sans antialiased\`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
`));
files.set("src/app/page.tsx", Buffer.from(`import { redirect } from "next/navigation";

/** Export-only: the bundle is just the kitchen sink. */
export default function Home() {
  redirect("/kitchen-sink/screens");
}
`));

// 5. The brief.
files.set("V0.md", Buffer.from(BRIEF()));

// 6. Fingerprints, so v0:import can tell what v0 changed.
let commit = "unknown";
try { commit = execSync("git rev-parse --short HEAD", { cwd: FRONTEND }).toString().trim(); } catch {}
const manifest = {
  exportedAt: new Date().toISOString(),
  commit,
  files: Object.fromEntries([...files].map(([rel, buf]) => [rel, sha(buf)])),
};
files.set(MANIFEST, Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));

// Write the folder and the zip.
fs.rmSync(EXPORT_DIR, { recursive: true, force: true });
for (const [rel, buf] of files) {
  const out = path.join(EXPORT_DIR, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
}
writeZip(EXPORT_ZIP, files);

const rel = (p) => path.relative(process.cwd(), p) || ".";
console.log(`v0 export: ${files.size} files (${sources.length} source files) from commit ${commit}`);
console.log(`  folder  ${rel(EXPORT_DIR)}`);
console.log(`  zip     ${rel(EXPORT_ZIP)}   <- give this to v0`);
console.log(`\nWhen v0 is done, download its project and run:  npm run v0:import <zip or folder>`);

function BRIEF() {
  return `# MortgageModeler kitchen sink: visual design brief

This is the design system of a mortgage modelling app, packed on its own:
the kitchen sink (\`/kitchen-sink\`) and every file it imports. The same files
render the real app, so improvements made here are copied back into it.

**Your job: improve the visuals only.** Colour, type, spacing, radius, shadows,
layout, hierarchy, polish. Not behaviour, data or calculations.

## Run it

\`\`\`sh
npm install
npm run dev     # then open /kitchen-sink (home redirects to /kitchen-sink/screens)
\`\`\`

## What's here

Six layers, each built only from the ones before it (one page each):

| Page | Shows | Edit |
|---|---|---|
| /kitchen-sink | Tokens: type, colour, surfaces | \`src/app/globals.css\` |
| /kitchen-sink/primitives | Controls (shadcn/ui) and their variants | \`src/components/ui/*\` |
| /kitchen-sink/blocks | Titles, numbers, lists, alerts | \`src/components/patterns/blocks/*\` |
| /kitchen-sink/cards | Cards, KPI cards, page bar | \`src/components/patterns/cards/*\` |
| /kitchen-sink/layouts | Page arrangements | \`src/components/patterns/layouts/*\` |
| /kitchen-sink/screens | The real Cashflow and Purchase Costs screens, on sample data | \`src/components/cashflow/*\`, \`src/components/purchase-costs/*\`, \`src/components/domain/*\` |

Change a piece in the lowest layer that owns it (a colour in \`globals.css\`, a
button in \`components/ui\`, a card in \`patterns/cards\`) so every screen follows.
More detail: \`docs/KITCHEN_SINK.md\`, \`docs/TOKENS.md\`, \`docs/SHADCN.md\`, \`CLAUDE.md\`.

## Rules

Only changes to these files are copied back into the app:

- \`src/app/globals.css\`
- \`src/components/ui/**\`, \`src/components/patterns/**\`, \`src/components/domain/**\`
- \`src/components/cashflow/**\`, \`src/components/purchase-costs/**\`

Everything else is ignored, so don't spend effort there:

- \`src/hooks/**\`, \`src/lib/**\` (data, calculations, API)
- \`src/app/kitchen-sink/**\` (the gallery itself, and its sample data). Never
  restyle a screen inside the kitchen sink; edit its component.
- Config, \`package.json\` (no new packages), this file.

Inside the allowed files:

- Keep every component's name, props and exports; keep data flowing through props.
- Colours come from the tokens in \`globals.css\` (\`bg-surface-raised\`,
  \`text-fg-primary\`, \`text-brand\`…). No raw hex in components.
- Use the shadcn components in \`components/ui\` and their variants; add a variant
  rather than a one-off style. Don't hand-roll buttons, inputs or dialogs.
- Dark theme only. Keep it accessible: labels, focus states, contrast.
`;
}
