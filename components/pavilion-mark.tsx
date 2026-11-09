import type { ReactNode } from "react";

type MarkProps = {
  className?: string;
  /** Omit beside a text label; provide when the mark conveys meaning alone. */
  title?: string;
};

/**
 * Original editorial marks for the six themes on the supplied takeaway sheet.
 * These are not sacred symbols, BAPS logos, or copies of temple carvings.
 * The architectural frame uses an original cusped arch profile informed by:
 * https://londonmandir.baps.org/the-haveli/art-architecture/
 */
function MarkFrame({
  className = "",
  title,
  children,
  section,
}: MarkProps & { children: ReactNode; section?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
      focusable="false"
      data-section-icon={section}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

function sectionDrawing(section: number) {
  switch (section) {
    case 1:
      // An everyday vessel rests on folded cloth: the source's food and dress.
      return (
        <>
          <path d="M10 20c0-2.5 6.3-4.5 14-4.5S38 17.5 38 20s-6.3 4.5-14 4.5S10 22.5 10 20Z" />
          <path d="M10 20c1.6 9.3 6.2 14 14 14s12.4-4.7 14-14M19 34v3h10v-3" />
          <path d="M8 38h32v4H8zM31 38l-4 4M14 38v4M20 7v4M28 7v4" />
        </>
      );
    case 2:
      // Interwoven strands express relationships and continuity, not a named rite.
      return (
        <>
          <path d="M13 7c-5 7-5 11 1 16l12 10c6 5 6 9 3 11M20 5c-6 8-6 11 0 16l12 10c6 5 6 8 2 12" />
          <path d="M35 7c5 7 5 11-1 16l-12 10c-6 5-6 9-3 11M28 5c6 8 6 11 0 16l-12 10c-6 5-6 8-2 12" />
          <path d="M12 13h7M29 13h7M18.5 35l5.5 4 5.5-4" />
        </>
      );
    case 3:
      // The source's journey/map metaphor; no visual claim about the atma itself.
      return (
        <>
          <path d="M8 35V21c0-5 2.5-7 6-7 0-4 4-7 10-10 6 3 10 6 10 10 3.5 0 6 2 6 7v14" />
          <path d="M6 39h10M33 39h9M17 43c0-5 15-5 15-11s-14-4-14-10c0-3.4 4-5 9-7M17 35c3-1 6-1.5 8-3" />
        </>
      );
    case 4:
      // A diya interprets light over darkness without assigning a named festival.
      return (
        <>
          <path d="M24 5c.7 5.3 6 7.4 6 12.3a6 6 0 0 1-12 0C18 13 22.2 10.4 24 5ZM24 15c-1.8 2-2.7 3.3-2.7 5.2" />
          <path d="M8 28c4-2.5 9.3-3.5 16-3.5S36 25.5 40 28M8 28h32c-2.5 8-7.8 12-16 12S10.5 36 8 28ZM18 43h12" />
        </>
      );
    case 5:
      // Two supporting hands and a heart make the source's kindness legible.
      return (
        <>
          <path d="M24 25c-2.5-2-10-6.5-10-11.3a5.2 5.2 0 0 1 10-2 5.2 5.2 0 0 1 10 2C34 18.5 26.5 23 24 25Z" />
          <path d="M6 25v6l8 9h8V29.5c0-2-3-3-4.4-1.4l-1.4 1.6-5.5-7.3C9 20.2 6 21.4 6 25ZM42 25v6l-8 9h-8V29.5c0-2 3-3 4.4-1.4l1.4 1.6 5.5-7.3C39 20.2 42 21.4 42 25Z" />
          <path d="m16.2 29.7 3.1 4M31.8 29.7l-3.1 4M14 43h8M26 43h8" />
        </>
      );
    default:
      // Three distinct pillars share one foundation, as in the source's triad.
      return (
        <>
          <path d="M7 16h34M9 12c5 0 8-2 10-5 1 2.4 2.8 4 5 4s4-1.6 5-4c2 3 5 5 10 5" />
          <path d="M10 20h5M21.5 20h5M33 20h5M10 34h5M21.5 34h5M33 34h5" />
          <path d="M11 20v14M14 20v14M22.5 20v14M25.5 20v14M34 20v14M37 20v14M8 38h32M5 42h38" />
          <path d="M17 24c0-3 2-5 5-5M27 19c2.5 0 4 2 4 5" />
        </>
      );
  }
}

export function SectionIcon({
  section = 1,
  className,
  title,
}: MarkProps & { section?: number }) {
  const id =
    Number.isInteger(section) && section >= 1 && section <= 6 ? section : 1;
  return (
    <MarkFrame className={className} title={title} section={id}>
      {sectionDrawing(id)}
    </MarkFrame>
  );
}

/** Backwards-compatible name used by existing section lists and menus. */
export function PavilionMark({
  variant = 1,
  className,
  title,
}: MarkProps & { variant?: number }) {
  return <SectionIcon section={variant} className={className} title={title} />;
}

/** Architectural brand mark, kept separate from the six thematic section marks. */
export function MandirMark({ className, title }: MarkProps) {
  return (
    <MarkFrame className={className} title={title}>
      <path d="M15 23 17 18h2l1-5 2-3 2-6 2 6 2 3 1 5h2l2 5M19 18h10M21 13h6M24 4V2" />
      <path d="M7 24h34M9 28h30M5 39h38M8 43h32M10 28v11M14 28v11M34 28v11M38 28v11" />
      <path d="M19 39v-8c0-2 2.5-3 5-5 2.5 2 5 3 5 5v8M7 24v-5c2-1 3.5-3 4-5 .5 2 2 4 4 5v4M33 23v-4c2-1 3.5-3 4-5 .5 2 2 4 4 5v5" />
    </MarkFrame>
  );
}
