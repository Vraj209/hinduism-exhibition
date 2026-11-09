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

export function HeroTitle() {
  return <h1 className={`hero-title ${heroScript.className}`}>Hinduism</h1>;
}
