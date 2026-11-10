import { readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";

// Keep full prompts/provenance in the design audit, not in the browser bundle.
const manifests = ["attire-generated-1-14.json", "attire-generated-15-28.json"];
const images = {};
for (const filename of manifests) {
  const manifest = JSON.parse(await readFile(resolve("docs/design", filename), "utf8"));
  for (const entry of manifest.images ?? manifest.entries) {
    await access(resolve("public", entry.src.slice(1)));
    images[entry.id] = {
      src: entry.src,
      alt: `Generated illustration of the ${entry.name ?? entry.state} outfit pairing from the Bhusha poster, with both full outfits visible.`,
      width: entry.width,
      height: entry.height,
      kind: "generated-illustration",
    };
  }
}
const source = `// Prepared from the reviewed individual-image manifests. See docs/design/attire-generated-*.json.\nimport type { CulturalState } from "./jivan-shaili";\n\nexport const attireImages: Record<string, NonNullable<CulturalState["attire"]["image"]>> = ${JSON.stringify(images, null, 2)};\n`;
await writeFile(resolve("content/attire-images.ts"), source);
console.log(`Prepared ${Object.keys(images).length} individual attire images.`);
