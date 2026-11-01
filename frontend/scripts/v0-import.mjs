// npm run v0:import <zip or folder> [--dry-run]
//
// Copies v0's visual changes back into the app. Only files under the visual
// paths (globals.css, components/ui, patterns, domain, cashflow,
// purchase-costs) are applied. Anything else v0 changed (hooks, lib, the
// kitchen sink, config, new packages) is listed and saved to
// frontend/v0-incoming/ for review, never applied. A file you also changed
// since the export is a conflict: saved there too, not overwritten.

import fs from "node:fs";
import path from "node:path";
import {
  EXPORT_DIR, FRONTEND, INCOMING_DIR, MANIFEST, SCAFFOLD,
  isVisual, readFolder, readZip, sha,
} from "./v0-lib.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const input = args.find((a) => !a.startsWith("--"));
if (!input) {
  console.error("Usage: npm run v0:import <v0 zip or folder> [-- --dry-run]");
  process.exit(1);
}
const inputPath = path.resolve(input);
if (!fs.existsSync(inputPath)) {
  console.error(`Not found: ${inputPath}`);
  process.exit(1);
}

// Load v0's files and find the project root inside (zips often add a top folder).
const all = fs.statSync(inputPath).isDirectory() ? readFolder(inputPath) : readZip(inputPath);
const marker = [...all.keys()].find((k) => k.endsWith(MANIFEST)) ?? [...all.keys()].find((k) => /(^|\/)src\/app\/kitchen-sink\//.test(k));
if (!marker) {
  console.error("That doesn't look like a v0 export: no .v0-manifest.json or src/app/kitchen-sink/ inside.");
  process.exit(1);
}
const prefix = marker.endsWith(MANIFEST) ? marker.slice(0, -MANIFEST.length) : marker.slice(0, marker.indexOf("src/app/kitchen-sink/"));
const v0 = new Map(
  [...all]
    .filter(([k]) => k.startsWith(prefix) && !/(^|\/)(node_modules|\.next)\//.test(k))
    .map(([k, buf]) => [k.slice(prefix.length), buf]),
);

// The export's fingerprints: from the bundle, else from the last local export.
const manifestBuf = v0.get(MANIFEST) ?? (fs.existsSync(path.join(EXPORT_DIR, MANIFEST)) ? fs.readFileSync(path.join(EXPORT_DIR, MANIFEST)) : null);
const manifest = manifestBuf ? JSON.parse(manifestBuf) : null;
if (!manifest) console.warn("No .v0-manifest.json found: comparing against the app as it is now, so conflicts can't be detected.\n");
const base = manifest?.files ?? {};

const repoHash = (rel) => {
  const f = path.join(FRONTEND, rel);
  return fs.existsSync(f) ? sha(fs.readFileSync(f)) : null;
};

const applied = [];
const conflicts = [];
const blocked = [];
const added = [];

for (const [rel, buf] of v0) {
  if (SCAFFOLD.has(rel)) continue;
  const now = sha(buf);
  const before = base[rel] ?? null;
  const current = repoHash(rel);
  if (before ? now === before : now === current) continue; // v0 didn't change it

  if (!isVisual(rel)) {
    blocked.push(rel);
    stash(rel, buf);
  } else if (before && current !== before) {
    conflicts.push(rel); // you changed it too since the export
    stash(rel, buf);
  } else {
    (current ? applied : added).push(rel);
    if (!dryRun) {
      const out = path.join(FRONTEND, rel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, buf);
    }
  }
}

const deleted = Object.keys(base).filter((rel) => !SCAFFOLD.has(rel) && !v0.has(rel));

// New or changed packages (never applied).
const pkgNotes = [];
const v0Pkg = v0.get("package.json");
if (v0Pkg && manifest) {
  const appPkg = JSON.parse(fs.readFileSync(path.join(FRONTEND, "package.json")));
  const theirs = JSON.parse(v0Pkg);
  for (const field of ["dependencies", "devDependencies"]) {
    for (const [name, ver] of Object.entries(theirs[field] ?? {})) {
      const ours = appPkg[field]?.[name] ?? appPkg.dependencies?.[name] ?? appPkg.devDependencies?.[name];
      if (ours !== ver) pkgNotes.push(`${name} ${ours ? `${ours} -> ` : ""}${ver}${ours ? "" : " (new)"}`);
    }
  }
}

function stash(rel, buf) {
  if (dryRun) return;
  const out = path.join(INCOMING_DIR, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
}

// Report.
const list = (title, items, note = "") => {
  if (!items.length) return;
  console.log(`\n${title} (${items.length})${note}`);
  for (const i of items) console.log(`  ${i}`);
};
console.log(`v0 import ${dryRun ? "(dry run, nothing written) " : ""}from ${path.basename(inputPath)}${manifest ? `, exported from commit ${manifest.commit}` : ""}`);
list(dryRun ? "Would update" : "Updated", applied);
list(dryRun ? "Would add" : "Added", added);
list("Conflicts: you changed these since the export, so v0's version wasn't applied", conflicts, dryRun ? "" : ` -> saved in ${path.relative(FRONTEND, INCOMING_DIR)}/`);
list("Not applied: outside the visual files", blocked, dryRun ? "" : ` -> saved in ${path.relative(FRONTEND, INCOMING_DIR)}/`);
list("Deleted by v0 (not applied)", deleted);
list("Package changes (not applied; add by hand if wanted)", pkgNotes);
if (!applied.length && !added.length && !conflicts.length && !blocked.length && !deleted.length && !pkgNotes.length) {
  console.log("\nNo changes from v0.");
} else if (!dryRun && (applied.length || added.length)) {
  console.log("\nNext: review with `git diff`, then `npx tsc --noEmit`, `npm run lint` and `npm test`.");
}
