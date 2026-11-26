// npm run package -- <slug|all> [--channel=none]
// Builds a self-contained zip per game for portals and app wrappers:
//   dist/packages/<channel>/<slug>.zip
// The kit and any shared files the game references (../../...) are copied in,
// paths are rewritten to ./..., and window.OL_CONFIG pins the channel so the
// kit loads that channel's ad adapter instead of fetching /ads/config.json.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { deflateRawSync, crc32 } from "node:zlib";

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const target = args.find((a) => !a.startsWith("--"));
const channel = flags.channel || "none";
const CHANNELS = ["none"]; // phase 2 adds portal adapters to the kit, then their names here

if (!target) { console.error("Usage: npm run package -- <slug|all> [--channel=none]"); process.exit(1); }
if (!CHANNELS.includes(channel)) { console.error(`Unknown channel "${channel}". Known: ${CHANNELS.join(", ")}`); process.exit(1); }

const games = JSON.parse(readFileSync("lib/games.json", "utf8")).filter((g) => g.platforms.web);
const slugs = target === "all" ? games.filter((g) => !g.draft).map((g) => g.slug) : [target];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// Minimal zip writer (deflate), no dependencies. Fixed date keeps zips reproducible.
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
function zip(entries) {
  const files = [], central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name);
    const comp = deflateRawSync(data, { level: 9 });
    const crc = crc32(data) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(DOS_DATE, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    files.push(local, nameBuf, comp);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(8, 10); cen.writeUInt16LE(0, 12); cen.writeUInt16LE(DOS_DATE, 14); cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(data.length, 24); cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);
    offset += local.length + nameBuf.length + comp.length;
  }
  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cenBuf.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, cenBuf, end]);
}

const outDir = join("dist/packages", channel);
mkdirSync(outDir, { recursive: true });

for (const slug of slugs) {
  const src = join("public/play", slug);
  if (!existsSync(join(src, "index.html"))) { console.error(`No game at ${src}`); process.exitCode = 1; continue; }

  const entries = new Map(); // zip path -> Buffer
  const shared = new Set();
  const TEXT = /\.(html|css|js|json|svg|txt|md)$/i;

  for (const file of walk(src)) {
    const rel = relative(src, file).split("\\").join("/");
    let buf = readFileSync(file);
    if (TEXT.test(file)) {
      let s = buf.toString("utf8");
      s = s.replace(/\.\.\/\.\.\/([A-Za-z0-9._\/-]+)/g, (m, p) => { shared.add(p); return `./${p}`; });
      if (rel === "index.html") {
        const cfg = `<script>window.OL_CONFIG=${JSON.stringify({ channel })};</script>`;
        s = s.replace(/(<script src="\.\/kit\/ol-kit\.js")/, `${cfg}\n  $1`);
      }
      buf = Buffer.from(s);
    }
    entries.set(rel, buf);
  }
  for (const p of shared) {
    const file = join("public", p);
    if (!existsSync(file)) { console.error(`${slug}: missing shared file public/${p}`); process.exitCode = 1; continue; }
    entries.set(p, readFileSync(file));
  }
  // Licence for bundled fonts travels with them
  if ([...shared].some((p) => p.startsWith("fonts/"))) {
    for (const f of readdirSync("public/fonts").filter((f) => f.endsWith(".txt"))) entries.set(`fonts/${f}`, readFileSync(join("public/fonts", f)));
  }

  const out = join(outDir, `${slug}.zip`);
  writeFileSync(out, zip([...entries].sort(([a], [b]) => a.localeCompare(b)).map(([name, data]) => ({ name, data }))));
  const kb = (statSync(out).size / 1024).toFixed(0);
  console.log(`${out}  ${entries.size} files, ${kb} KB`);
}
