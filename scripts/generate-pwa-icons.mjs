import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const logoPath = path.join(root, "public/brand/mais-barato-logo.png");
const outDir = path.join(root, "public/icons");

const BRAND_RED = "#E2131A";

async function makeIcon({ size, logoScale, outFile, background }) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(outDir, outFile));

  console.log(`generated ${outFile}`);
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function main() {
  await mkdir(outDir, { recursive: true });
  // "any" purpose icons (favicon, install prompt, app icon on launchers that don't mask) — transparent background.
  await makeIcon({ size: 192, logoScale: 0.8, outFile: "icon-192.png", background: TRANSPARENT });
  await makeIcon({ size: 512, logoScale: 0.8, outFile: "icon-512.png", background: TRANSPARENT });
  // Maskable variant needs a solid background + extra safe-zone padding since OS icon masks crop the edges.
  await makeIcon({ size: 512, logoScale: 0.6, outFile: "icon-512-maskable.png", background: BRAND_RED });
}

main();
