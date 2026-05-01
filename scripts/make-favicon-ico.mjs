// Build a multi-size favicon.ico from a square PNG source. Browsers (especially
// older ones, and Chrome's legacy auto-request for /favicon.ico) handle .ico
// best. Embeds 16, 32, 48 — the three sizes browsers actually use for tabs.
//
// Usage: node scripts/make-favicon-ico.mjs <input.png> <output.ico>

import sharp from "sharp";
import toIco from "to-ico";
import { promises as fs } from "node:fs";

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error("usage: node scripts/make-favicon-ico.mjs <input.png> <output.ico>");
  process.exit(1);
}

const sizes = [16, 32, 48];
const buffers = await Promise.all(
  sizes.map((size) =>
    sharp(input).resize(size, size).png().toBuffer(),
  ),
);

const ico = await toIco(buffers);
await fs.writeFile(output, ico);
console.log(`wrote ${output} — sizes ${sizes.join(", ")}, ${ico.length} bytes`);
