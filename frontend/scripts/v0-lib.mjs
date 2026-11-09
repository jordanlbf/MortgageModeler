// Shared helpers for v0-export / v0-import: paths, hashing, the kitchen sink's
// dependency graph, which files v0 may change, and a tiny zip reader/writer
// (plain Node, no packages).

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export const FRONTEND = path.resolve(import.meta.dirname, "..");
export const SRC = path.join(FRONTEND, "src");
export const EXPORT_DIR = path.join(FRONTEND, "v0-export");
export const EXPORT_ZIP = path.join(FRONTEND, "v0-export.zip");
export const INCOMING_DIR = path.join(FRONTEND, "v0-incoming");
export const MANIFEST = ".v0-manifest.json";

/** Files v0 may change; these are copied back by v0:import. Everything else is reported, not applied. */
export const VISUAL_PATHS = [
  /^src\/app\/globals\.css$/,
  /^src\/components\/(ui|patterns|domain|cashflow|purchase-costs|tax)\//,
];
export const isVisual = (rel) => VISUAL_PATHS.some((re) => re.test(rel));

/** Files the export adds for v0 only; never copied back. */
export const SCAFFOLD = new Set([
  "V0.md",
  MANIFEST,
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "package.json",
  "package-lock.json",
]);

/** Config copied as-is so the bundle builds; reported (not applied) if v0 edits them. */
export const CONFIG_FILES = ["tsconfig.json", "next.config.ts", "postcss.config.mjs", "components.json", "eslint.config.mjs", "src/app/icon.svg"];

/** Read-only reference docs included for v0. */
export const DOC_FILES = ["docs/KITCHEN_SINK.md", "docs/SHADCN.md", "docs/TOKENS.md", "CLAUDE.md"];

export const toPosix = (p) => p.split(path.sep).join("/");
export const sha = (buf) => createHash("sha256").update(buf).digest("hex");

/* ── Dependency graph ── */

const EXTS = ["", ".ts", ".tsx", ".mjs", "/index.ts", "/index.tsx"];
const IMPORT_RE = /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;

function resolveImport(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // a package
  for (const ext of EXTS) {
    const f = base + ext;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}

/** Every source file reachable from the kitchen sink (tests excluded), as posix paths relative to frontend/. */
export function kitchenSinkFiles() {
  const entryDir = path.join(SRC, "app", "kitchen-sink");
  const entries = fs
    .readdirSync(entryDir, { recursive: true })
    .map((f) => path.join(entryDir, f))
    .filter((f) => /\.(tsx?|css)$/.test(f) && !toPosix(f).includes("/__tests__/") && fs.statSync(f).isFile());
  entries.push(path.join(SRC, "app", "globals.css"));

  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (!/\.(tsx?|mjs)$/.test(file)) return;
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3];
      const target = resolveImport(spec, file);
      if (target) walk(target);
    }
  };
  entries.forEach(walk);
  return [...seen].map((f) => toPosix(path.relative(FRONTEND, f))).sort();
}

/* ── Zip (store + deflate, no zip64) ── */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Writes `files` (Map of posix path → Buffer) to a zip at `out`. */
export function writeZip(out, files) {
  const local = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const [name, data] of files) {
    const nameBuf = Buffer.from(name, "utf8");
    const deflated = zlib.deflateRawSync(data);
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const crc = crc32(data);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6); // UTF-8 names
    header.writeUInt16LE(useDeflate ? 8 : 0, 8);
    header.writeUInt16LE(dosTime, 10);
    header.writeUInt16LE(dosDate, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(body.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);
    local.push(header, nameBuf, body);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(useDeflate ? 8 : 0, 10);
    entry.writeUInt16LE(dosTime, 12);
    entry.writeUInt16LE(dosDate, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(body.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBuf.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBuf);

    offset += header.length + nameBuf.length + body.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(out, Buffer.concat([...local, centralBuf, end]));
}

/** Reads a zip into a Map of posix path → Buffer (files only). */
export function readZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(`${file} isn't a zip file`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Corrupt zip: bad central directory");
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen).replace(/\\/g, "/");
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;
    const dataStart = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
    const raw = buf.subarray(dataStart, dataStart + size);
    if (method === 0) files.set(name, Buffer.from(raw));
    else if (method === 8) files.set(name, zlib.inflateRawSync(raw));
    else throw new Error(`Unsupported zip compression (method ${method}) for ${name}`);
  }
  return files;
}

/** Reads a folder into a Map of posix path → Buffer, skipping node_modules, .next and .git. */
export function readFolder(dir) {
  const files = new Map();
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git"].includes(ent.name)) continue;
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else files.set(toPosix(path.relative(dir, full)), fs.readFileSync(full));
    }
  };
  walk(dir);
  return files;
}
