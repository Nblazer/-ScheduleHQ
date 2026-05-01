// One-off helper: take a non-square logo PNG and produce a square PNG
// suitable for favicons. Trims transparent edges first so the logo
// content fills as much of the square as possible, then pads + resizes
// to the target square in one sharp pipeline.
//
// Usage:  node scripts/square-favicon.mjs <input.png> <output.png> [size]

import sharp from "sharp";

const [, , input, output, sizeArg] = process.argv;
if (!input || !output) {
  console.error("usage: node scripts/square-favicon.mjs <input.png> <output.png> [size]");
  process.exit(1);
}

const target = Number(sizeArg ?? 1024);

await sharp(input)
  // Strip transparent borders so the logo content drives the square.
  .trim({ threshold: 1 })
  // Resize into a target×target square, padding short side transparently.
  .resize(target, target, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(output);

const meta = await sharp(output).metadata();
console.log(`wrote ${output} — ${meta.width}x${meta.height}`);
