// Cloudflare Pages is configured to publish `.vercel/output/static` (left over
// from next-on-pages). Mirror the static export there so the dashboard
// settings keep working unchanged. Once the Pages project's output directory
// is switched to `out`, `npm run build` alone is enough and this can go.
import { cpSync, rmSync, mkdirSync } from "node:fs";

const dest = ".vercel/output/static";
rmSync(dest, { recursive: true, force: true });
mkdirSync(".vercel/output", { recursive: true });
cpSync("out", dest, { recursive: true });
console.log(`Copied out/ -> ${dest}`);
