import Image from "next/image";

/** Pin anchors in the 900 × 650 overhead schematic, above each pavilion. */
export const fallbackPositions = [
  { id: 1, x: 32, y: (409 / 650) * 100, visible: true },
  { id: 2, x: 32, y: (289 / 650) * 100, visible: true },
  { id: 3, x: 32, y: (169 / 650) * 100, visible: true },
  { id: 4, x: 68, y: (169 / 650) * 100, visible: true },
  { id: 5, x: 68, y: (289 / 650) * 100, visible: true },
  { id: 6, x: 68, y: (409 / 650) * 100, visible: true },
];

export function FallbackMap() {
  return (
    <Image
      src="/campus-layout.svg"
      alt=""
      aria-hidden="true"
      fill
      unoptimized
      preload
      sizes="(max-width: 760px) 100vw, 70vw"
      style={{ objectFit: "contain" }}
    />
  );
}
