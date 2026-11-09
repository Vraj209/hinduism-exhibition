import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: "../public/fonts/cormorant-garamond.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "300 700",
});
const body = localFont({
  src: "../public/fonts/dm-sans.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Hinduism | A living exhibition",
  description:
    "Explore six spaces of Hindu life, traditions, belief, festivals, values, and the three pillars in an architectural exhibition.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
