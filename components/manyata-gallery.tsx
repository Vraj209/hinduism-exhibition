"use client";

import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import type { ExhibitionSection } from "@/content/exhibition";
import { beliefs, beliefImages, type Belief } from "@/content/beliefs";
import { BeliefMotif, NicheCarving } from "./manyata-motifs";
import "./manyata-gallery.css";

const gujarati = localFont({ src: "../public/fonts/noto-sans-gujarati.woff2", variable: "--font-gujarati", display: "swap", weight: "100 900", preload: false });

type Props = {
  section: ExhibitionSection;
  hash: string;
  campusArrived: boolean;
  reducedMotion: boolean;
  exiting: boolean;
  onVisited: (id: number) => void;
};

export function ManyataGallery({ section, hash, campusArrived, reducedMotion, exiting, onVisited }: Props) {
  const ready = campusArrived && !exiting;
  const scroller = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const handledHash = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !scroller.current || handledHash.current === hash) return;
    handledHash.current = hash;
    onVisited(section.id);
    const suffix = hash.split("/")[1];
    // Retain the subjects of the original three story links.
    const legacy = { "story-1": "aatma", "story-2": "punarjanma", "story-3": "aatma" };
    const id = suffix?.startsWith("belief-") ? suffix.slice(7) : legacy[suffix as keyof typeof legacy];
    const card = beliefs.some((belief) => belief.id === id) ? scroller.current.querySelector<HTMLElement>(`[data-belief="${id}"]`) : null;
    if (suffix === "closing") {
      scroller.current.scrollTop = scroller.current.scrollHeight;
      scroller.current.querySelector<HTMLElement>(".manyata-next")?.focus({ preventScroll: true });
    } else if (card) {
      const viewport = scroller.current;
      viewport.scrollTop += card.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 32;
      card.focus({ preventScroll: true });
    } else {
      scroller.current.scrollTop = 0;
      heading.current?.focus({ preventScroll: true });
    }
  }, [hash, ready, section.id, onVisited]);

  useEffect(() => {
    const viewport = scroller.current;
    if (!ready || !viewport || reducedMotion) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, stagger) => {
        animations.push(entry.target.animate(
          [{ opacity: 0.25, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 650, delay: Math.min(stagger, 2) * 85, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" },
        ));
        observer.unobserve(entry.target);
      });
    }, { root: viewport, threshold: 0.12 });
    viewport.querySelectorAll(".belief-reveal").forEach((card) => observer.observe(card));
    return () => { observer.disconnect(); animations.forEach((animation) => animation.cancel()); };
  }, [ready, reducedMotion]);

  useEffect(() => {
    const viewport = scroller.current;
    const footer = viewport?.querySelector(".manyata-end");
    if (!ready || !viewport || !footer) return;
    const observer = new IntersectionObserver(([entry]) => {
      const base = `#section-${section.slug}`;
      if (entry.isIntersecting && location.hash.split("/")[0] === base && location.hash !== `${base}/closing`) {
        handledHash.current = `${base}/closing`;
        history.replaceState(history.state, "", `${base}/closing`);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    }, { root: viewport, threshold: 0.5 });
    observer.observe(footer);
    return () => observer.disconnect();
  }, [ready, section.slug]);

  return (
    <section className={`dome-gallery manyata-gallery ${gujarati.variable} ${ready ? "gallery-ready" : ""} ${exiting ? "gallery-exiting" : ""}`}
      aria-label={`${section.title} exhibition gallery`} aria-hidden={exiting} inert={exiting} data-arrived={ready} data-mode="beliefs">
      <div className="manyata-room-light" aria-hidden="true" />
      <header className="gallery-header">
        <a href="#map" className="gallery-back"><ArrowLeft size={16} /><span>Back to Campus</span></a>
        <p className="gallery-chapter"><span>EXHIBITION 03</span><span className="gallery-chapter-title">{section.title}</span></p>
        <Link className="manyata-credits" href="/references#manyata-visual-credits">Credits <ArrowUpRight size={13} /></Link>
      </header>
      {!ready && !exiting && <p className="gallery-entering" role="status">Entering {section.title}…</p>}
      <div ref={scroller} className="gallery-scroll manyata-scroll" tabIndex={0} role="region" aria-label="Six beliefs, scroll to explore" inert={!ready} aria-hidden={!ready}>
        <article className="manyata-hero gallery-opening">
          <div className="gallery-copy">
            <p className="gallery-eyebrow">{section.theme}</p>
            <h1 ref={heading} tabIndex={-1}>{section.title}</h1>
            <p className="gallery-caption">{section.message}</p>
            <button className="gallery-scroll-cue" onClick={() => {
              const cards = scroller.current?.querySelector<HTMLElement>(".belief-grid");
              if (cards) scroller.current?.scrollTo({ top: cards.offsetTop - 32, behavior: reducedMotion ? "instant" : "smooth" });
            }}>Explore the six beliefs <ArrowDown size={16} /></button>
          </div>
        </article>
        <ol className="belief-grid" aria-label="Six Hindu beliefs">
          {beliefs.map((belief) => <li key={belief.id} className="belief-reveal"><BeliefCard belief={belief} /></li>)}
        </ol>
        <footer className="manyata-end">
          <Link href="/references#manyata-visual-credits" className="manyata-credits">Visuals & credits <ArrowUpRight size={13} /></Link>
          <a href="#section-hindu-festivals" className="gallery-next-exhibition manyata-next">Next Exhibition <ArrowRight size={16} /></a>
        </footer>
      </div>
    </section>
  );
}

function BeliefCard({ belief }: { belief: Belief }) {
  const image = belief.id === "avatar" || belief.id === "murti" ? beliefImages[belief.id] : null;
  return (
    <article className={`belief-card belief-${belief.id}`} data-belief={belief.id} tabIndex={0}
      aria-labelledby={`belief-${belief.id}-title`} aria-describedby={`belief-${belief.id}-english belief-${belief.id}-gujarati`}
      style={{ "--belief-accent": belief.accent } as CSSProperties}>
      <div className="belief-stone" aria-hidden="true" />
      <div className="belief-carving"><NicheCarving /></div>
      <span className="belief-medallion" aria-label={`Belief ${Number(belief.number)}`}>{belief.number}</span>
      <div className={`belief-visual ${image ? "belief-visual-image" : ""}`}>
        {image ? <div className={`belief-devotional-frame belief-devotional-${belief.id}`}>
          <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes={belief.id === "murti" ? "120px" : "210px"} loading="lazy" />
        </div> : <div role="img" aria-label={belief.visualDescription}><BeliefMotif kind={belief.id as "aatma" | "karma" | "punarjanma" | "moksha"} /></div>}
      </div>
      <div className="belief-copy">
        <h2 id={`belief-${belief.id}-title`}>{belief.title}</h2>
        <p className="belief-english" id={`belief-${belief.id}-english`}>{belief.english}</p>
        <span className="belief-divider" aria-hidden="true" />
        <p className="belief-gujarati" id={`belief-${belief.id}-gujarati`} lang="gu">{belief.gujarati}</p>
      </div>
      <div className="belief-ledge" aria-hidden="true"><span /></div>
    </article>
  );
}
