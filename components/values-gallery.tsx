"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ExhibitionSection } from "@/content/exhibition";
import { hinduValues, hinduValuePhotographs, type HinduValue } from "@/content/hindu-values";
import "./values-gallery.css";

type Props = {
  section: ExhibitionSection;
  hash: string;
  campusArrived: boolean;
  reducedMotion: boolean;
  exiting: boolean;
  onVisited: (id: number) => void;
};

export function ValuesGallery({ section, hash, campusArrived, reducedMotion, exiting, onVisited }: Props) {
  const ready = campusArrived && !exiting;
  const scroller = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const handledHash = useRef<string | null>(null);
  const revealed = useRef(new WeakSet<Element>());

  useEffect(() => {
    const viewport = scroller.current;
    if (!ready || !viewport || handledHash.current === hash) return;
    handledHash.current = hash;
    onVisited(section.id);
    const suffix = hash.split("/")[1];
    const legacy: Record<string, string> = { "story-1": "daya", "story-2": "aadar", "story-3": "tyag" };
    const id = suffix?.startsWith("value-") ? suffix.slice(6) : legacy[suffix];
    const card = hinduValues.some((value) => value.id === id) ? viewport.querySelector<HTMLElement>(`[data-value="${id}"]`) : null;
    if (suffix === "closing") {
      viewport.scrollTop = viewport.scrollHeight;
      viewport.querySelector<HTMLElement>(".values-next")?.focus({ preventScroll: true });
    } else if (card) {
      viewport.scrollTop += card.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 24;
      card.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    } else {
      viewport.scrollTop = 0;
      heading.current?.focus({ preventScroll: true });
    }
  }, [hash, ready, onVisited, section.id]);

  useEffect(() => {
    const viewport = scroller.current;
    if (!ready || !viewport || reducedMotion) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || revealed.current.has(entry.target)) continue;
        revealed.current.add(entry.target);
        // A single fade, with no translation or scroll-driven movement of text.
        animations.push(entry.target.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 550, easing: "ease-out" }));
        observer.unobserve(entry.target);
      }
    }, { root: viewport, threshold: 0.08 });
    viewport.querySelectorAll(".value-card").forEach((card) => observer.observe(card));
    return () => { observer.disconnect(); animations.forEach((animation) => animation.cancel()); };
  }, [ready, reducedMotion]);

  useEffect(() => {
    const viewport = scroller.current;
    const footer = viewport?.querySelector(".values-end");
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

  function explore() {
    const viewport = scroller.current;
    const first = viewport?.querySelector<HTMLElement>(".value-card");
    if (!viewport || !first) return;
    viewport.scrollTo({ top: viewport.scrollTop + first.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 24, behavior: reducedMotion ? "instant" : "smooth" });
    first.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }

  return (
    <section className={`dome-gallery values-gallery ${ready ? "gallery-ready" : ""} ${exiting ? "gallery-exiting" : ""}`}
      aria-label={`${section.title} exhibition gallery`} aria-hidden={exiting} inert={exiting} data-arrived={ready} data-mode="values">
      <header className="gallery-header">
        <a href="#map" className="gallery-back"><ArrowLeft size={16} /><span>Back to Campus</span></a>
        <p className="gallery-chapter"><span>EXHIBITION 05</span><span className="gallery-chapter-title">{section.title}</span></p>
        <Link className="values-credits" href="/references#hindu-values-credits">Photo credits <ArrowUpRight size={13} /></Link>
      </header>
      {!ready && !exiting && <p className="gallery-entering" role="status">Entering {section.title}…</p>}
      <div ref={scroller} className="gallery-scroll values-scroll" tabIndex={0} role="region" aria-label="Four values, scroll to explore" inert={!ready} aria-hidden={!ready}>
        <article className="values-hero gallery-opening">
          <ValueOrnament className="values-hero-ornament" />
          <div className="gallery-copy">
            <p className="gallery-eyebrow">{section.theme}</p>
            <h1 ref={heading} tabIndex={-1}>{section.title}</h1>
            <p className="gallery-caption">{section.message}</p>
            <button className="gallery-scroll-cue" onClick={explore}>Explore the four values <ArrowDown size={16} /></button>
          </div>
        </article>
        <ol className="values-list" aria-label="Four Hindu values">
          {hinduValues.map((value) => <li key={value.id}><ValueCard value={value} /></li>)}
        </ol>
        <footer className="values-end">
          <p>{section.reflection}</p>
          <div>
            <Link className="values-credits" href="/references#hindu-values-credits">Photographs & sources <ArrowUpRight size={13} /></Link>
            <a href="#section-hindu-sanskruti-adhar-stambh" className="gallery-next-exhibition values-next">Next Exhibition <ArrowRight size={16} /></a>
          </div>
        </footer>
      </div>
    </section>
  );
}

function ValueCard({ value }: { value: HinduValue }) {
  const photo = hinduValuePhotographs.find((item) => item.id === value.id)!;
  return (
    <article className="value-card" data-value={value.id} aria-labelledby={`value-${value.id}-title`}>
      <figure className="value-photo">
        <div className="value-photo-frame">
          <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 760px) 90vw, (max-width: 1440px) 44vw, 600px" loading="lazy" />
        </div>
        <figcaption>
          <p>{photo.caption}</p>
          <span>{photo.location} · <time dateTime={photo.date}>{photo.displayDate}</time></span>
          <a href={photo.sourcePageUrl} target="_blank" rel="noreferrer">{photo.credit} <ArrowUpRight size={11} /></a>
        </figcaption>
      </figure>
      <div className="value-copy">
        <ValueOrnament className="value-copy-ornament" />
        <span className="value-number" aria-hidden="true">{value.number}</span>
        <h2 id={`value-${value.id}-title`} tabIndex={-1}>{value.title}</h2>
        <p className="value-meaning">{value.meaning}</p>
        <span className="value-rule" aria-hidden="true" />
        <p className="value-description">{value.description}</p>
        {value.gujarati && <p className="value-gujarati" lang="gu">{value.gujarati}</p>}
      </div>
    </article>
  );
}

function ValueOrnament({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 240 240" fill="none" stroke="currentColor" strokeWidth="0.7" aria-hidden="true" focusable="false">
    <circle cx="120" cy="120" r="94" /><circle cx="120" cy="120" r="88" /><circle cx="120" cy="120" r="34" />
    {Array.from({ length: 12 }, (_, index) => <g key={index} transform={`rotate(${index * 30} 120 120)`}>
      <path d="M120 29C143 48 143 75 120 86C97 75 97 48 120 29ZM120 38C130 54 130 66 120 77C110 66 110 54 120 38ZM120 8C130 18 130 25 120 29C110 25 110 18 120 8" />
      <path d="M120 86L120 105" /><circle cx="120" cy="98" r="2" />
    </g>)}
    <circle cx="120" cy="120" r="15" /><circle cx="120" cy="120" r="5" />
  </svg>;
}
