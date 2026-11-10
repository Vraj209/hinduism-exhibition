import localFont from "next/font/local";

const heroScript = localFont({
  src: "../public/fonts/dancing-script-latin-600.woff2",
  weight: "600",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
});

export function HeroTitle({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="hero-title-layer">
      <h1 className={`hero-title ${heroScript.className}`} aria-hidden={ariaHidden}>Hinduism</h1>
    </div>
  );
}
