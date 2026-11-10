import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

// Reproducible derivative generation. Source selections remain reviewable in the
// research catalogues; only photographs covered by the owner's confirmation enter.
const root = process.cwd();
const photos = [];
for (const part of ['first', 'second']) {
  const file = path.join(root, `docs/design/dome-4-photo-candidates-${part}.json`);
  try { photos.push(...JSON.parse(await readFile(file, 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const out = path.join(root, 'public/gallery/festivals');
await mkdir(path.join(out, 'full'), { recursive: true });
const prepared = [];
for (const photo of photos) {
  if (!photo.approval && photo.approvalStatus !== 'user-confirmed-website-use') throw new Error(`Permission record missing for ${photo.id}`);
  const fullPath = path.join(out, 'full', `${photo.id}.jpg`);
  let bytes;
  try { bytes = await readFile(fullPath); }
  catch {
    if (photo.localResearchPath || photo.localPath) {
      try { bytes = await readFile(photo.localResearchPath || photo.localPath); } catch { /* Retrieve exact recorded source below. */ }
    }
    if (!bytes) {
      const response = await fetch(photo.sourceImageUrl);
      if (!response.ok) throw new Error(`${response.status}: ${photo.sourceImageUrl}`);
      bytes = Buffer.from(await response.arrayBuffer());
    }
    await writeFile(fullPath, bytes);
  }
  const meta = await sharp(bytes).metadata();
  if (!meta.width || !meta.height || !['jpeg', 'png', 'webp'].includes(meta.format)) throw new Error(`Invalid photo ${photo.id}`);
  const previewPath = path.join(out, `${photo.id}.webp`);
  try { await access(previewPath); }
  catch { await sharp(bytes).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 86 }).toFile(previewPath); }
  const source = { ...photo };
  delete source.localResearchPath;
  delete source.localPath;
  delete source.approval;
  delete source.approvalStatus;
  prepared.push({
    ...source,
    src: `/gallery/festivals/${photo.id}.webp`,
    fullSrc: `/gallery/festivals/full/${photo.id}.jpg`,
    width: meta.width,
    height: meta.height,
    credit: 'Photo: BAPS Swaminarayan Sanstha',
    permission: { status: 'approved', evidence: 'Exhibition owner confirmed in this chat on 9 November 2026: permission covers official BAPS event photos. This records owner authorization, not a public reuse licence.' },
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
if (new Set(prepared.map((photo) => photo.id)).size !== prepared.length) throw new Error('Duplicate photo ID');
await writeFile(path.join(root, 'content/festival-photographs.json'), `${JSON.stringify(prepared, null, 2)}\n`);
console.log(`Prepared ${prepared.length} photographs from ${new Set(prepared.map((photo) => photo.festivalId)).size} calendar entries.`);
