"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ExhibitionSection } from "@/content/exhibition";
import { festivalEntries, festivalGalleryEntries, festivalGalleryPhotos } from "@/content/festival-gallery";
import { FestivalLightbox } from "./festival-lightbox";
import "./festival-gallery.css";

const compositions: { entries: typeof festivalGalleryEntries; kind: string }[] = [];
const rhythm = [1, 2, 3, 1, 2];
// Preserve the destinations of the previous fourteen-story gallery's links.
const legacyStories = ["diwali", "new-year-annakut", "holi", "new-year-annakut", "fuldol", "ram-navami-shri-hari-jayanti", "ram-navami-shri-hari-jayanti", "janmashtami", "maha-shivratri", "raksha-bandhan", "guru-purnima", "rath-yatra", "uttarayan", "navratri-dussehra"];
for (let cursor = 0, row = 0; cursor < festivalGalleryEntries.length; row++) {
  const entries = festivalGalleryEntries.slice(cursor, cursor + rhythm[row % rhythm.length]);
  compositions.push({ entries, kind: entries.length === 1 ? "wide" : entries.length === 2 ? "pair" : "trio" });
  cursor += entries.length;
}

type Props = {
  section: ExhibitionSection;
  hash: string;
  campusArrived: boolean;
  reducedMotion: boolean;
  exiting: boolean;
  onVisited: (id: number) => void;
};

export function FestivalGallery({ section, hash, campusArrived, reducedMotion, exiting, onVisited }: Props) {
  const ready = campusArrived && !exiting;
  const scroller = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [opened, setOpened] = useState<{ index: number; origin: DOMRect } | null>(null);
  const handledHash = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    onVisited(section.id);
    const viewport = scroller.current;
    if (!viewport || handledHash.current === hash) return;
    handledHash.current = hash;
    const suffix = hash.split("/")[1];
    const ordinal = Number(suffix?.replace("story-", ""));
    const entry = festivalEntries.find((item) => item.id === legacyStories[ordinal - 1]);
    const target = suffix === "closing" ? viewport.querySelector<HTMLElement>(".festival-end")
      : suffix?.startsWith("story-") ? viewport.querySelector<HTMLElement>(`[data-festival="${entry?.id}"]`) : null;
    if (target) {
      viewport.scrollTop = target.offsetTop - 24;
      target.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true });
    } else {
      viewport.scrollTop = 0;
      hero.current?.focus({ preventScroll: true });
    }
  }, [ready, hash, onVisited, section.id]);

  useEffect(() => {
    const viewport = scroller.current;
    if (!ready || !viewport || reducedMotion) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animations.push(entry.target.animate(
          [{ opacity: 0.35, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 850, easing: "cubic-bezier(.2,.7,.2,1)" },
        ));
        observer.unobserve(entry.target);
      });
    }, { root: viewport, threshold: 0.08 });
    viewport.querySelectorAll(".festival-print").forEach((photo) => observer.observe(photo));
    return () => { observer.disconnect(); animations.forEach((animation) => animation.cancel()); };
  }, [ready, reducedMotion]);

  useEffect(() => {
    const viewport = scroller.current;
    if (opened === null || !viewport) return;
    const overflow = viewport.style.overflowY;
    viewport.style.overflowY = "hidden";
    return () => { viewport.style.overflowY = overflow; };
  }, [opened]);

  useEffect(() => {
    const viewport = scroller.current;
    const ending = viewport?.querySelector(".festival-end");
    if (!ready || !viewport || !ending) return;
    const observer = new IntersectionObserver(([entry]) => {
      const base = `#section-${section.slug}`;
      if (entry.isIntersecting && window.location.hash.split("/")[0] === base && window.location.hash !== `${base}/closing`) {
        handledHash.current = `${base}/closing`;
        history.replaceState(history.state, "", `${base}/closing`);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    }, { root: viewport, threshold: 0.3 });
    observer.observe(ending);
    return () => observer.disconnect();
  }, [ready, section.slug]);

  function close() {
    setOpened(null);
    trigger.current?.focus({ preventScroll: true });
  }

  return (
    <section className={`dome-gallery festival-gallery ${ready ? "gallery-ready" : ""} ${exiting ? "gallery-exiting" : ""}`}
      aria-label={`${section.title} exhibition gallery`} aria-hidden={exiting} inert={exiting} data-arrived={ready} data-mode="photographic">
      <header className="gallery-header">
        <a href="#map" className="gallery-back"><ArrowLeft size={16} /><span>Back to Campus</span></a>
        <p className="gallery-chapter"><span>EXHIBITION 04</span><span className="gallery-chapter-title">{section.title}</span></p>
        <Link className="festival-credit-link" href="/references#festival-photo-credits">Credits <ArrowUpRight size={13} /></Link>
      </header>
      {!ready && !exiting && <p className="gallery-entering" role="status">Entering {section.title}…</p>}
      <div ref={scroller} className="gallery-scroll festival-scroll" role="region" aria-label="Festival photographs, scroll to explore" tabIndex={0} inert={!ready} aria-hidden={!ready}>
        <article className="festival-hero gallery-opening">
          <div className="gallery-copy">
            <p className="gallery-eyebrow">{section.theme}</p>
            <h1 ref={hero} tabIndex={-1}>{section.title}</h1>
            <p className="gallery-caption">{section.message}</p>
            <button className="gallery-scroll-cue" onClick={() => {
              const target = scroller.current?.querySelector<HTMLElement>(".festival-compositions");
              if (target) scroller.current?.scrollTo({ top: target.offsetTop - 24, behavior: reducedMotion ? "instant" : "smooth" });
            }}>Scroll to Discover <ArrowDown size={16} /></button>
          </div>
        </article>
        <div className="festival-compositions" aria-label="Photographic collection">
          {compositions.map((composition, row) => (
            <div key={composition.entries[0].id} className={`festival-composition festival-composition-${composition.kind} ${row % 2 ? "festival-composition-reverse" : ""}`}>
              {composition.entries.map((entry) => {
                const photo = entry.photos[0];
                return <figure key={entry.id} className={`festival-print ${photo.height > photo.width * 1.15 ? "festival-print-portrait" : ""}`} data-festival={entry.id}>
                  <button className="festival-photo-button" aria-label={`Open photograph: ${photo.alt}`} aria-haspopup="dialog"
                    onClick={(event) => {
                      trigger.current = event.currentTarget;
                      setOpened({ index: festivalGalleryPhotos.findIndex((image) => image.id === photo.id), origin: event.currentTarget.getBoundingClientRect() });
                    }}>
                    <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height}
                      sizes={composition.kind === "wide" ? "(max-width: 760px) 94vw, 90vw" : composition.kind === "pair" ? "(max-width: 760px) 94vw, 50vw" : "(max-width: 760px) 94vw, 30vw"}
                      loading="lazy" draggable={false} />
                    <span className="festival-open-mark" aria-hidden="true"><ArrowUpRight size={19} /></span>
                  </button>
                </figure>;
              })}
            </div>
          ))}
        </div>
        <footer className="festival-end">
          <Link href="/references#festival-photo-credits" className="festival-collection-credit">Photography © BAPS Swaminarayan Sanstha <ArrowUpRight size={12} /></Link>
          <a className="gallery-next-exhibition" href="#section-hindu-mulyo">Next Exhibition <ArrowRight size={16} /></a>
        </footer>
      </div>
      {opened !== null && !exiting && <FestivalLightbox photos={festivalGalleryPhotos} initialIndex={opened.index} origin={opened.origin} onClose={close} reducedMotion={reducedMotion} />}
    </section>
  );
}
