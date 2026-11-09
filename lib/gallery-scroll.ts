/** Scroll is the only clock: a broad plateau gives each display time to be read. */
export function galleryFrame(distance: number) {
  const away = Math.abs(distance);
  const travel = Math.max(0, (away - 0.24) / 0.76);
  return {
    opacity: Math.max(0, 1 - travel),
    // Adjacent photographs overlap, but adjacent paragraphs never do.
    copyOpacity: Math.max(0, 1 - Math.max(0, away - 0.24) / 0.23),
    z: distance > 0 ? -travel * 260 : travel * 80,
    y: distance > 0 ? travel * 38 : -travel * 42,
  };
}

export function galleryIndexFromHash(hash: string, storyCount: number) {
  if (hash.endsWith("/closing")) return storyCount + 1;
  const match = /\/story-(\d+)$/.exec(hash);
  return match ? Math.max(1, Math.min(storyCount, Number(match[1]))) : 0;
}

export function galleryHash(slug: string, index: number, count: number) {
  const base = `#section-${slug}`;
  return index === 0 ? base : index === count - 1 ? `${base}/closing` : `${base}/story-${index}`;
}
