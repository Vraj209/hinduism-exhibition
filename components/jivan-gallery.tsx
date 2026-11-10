"use client";

import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ExhibitionSection } from "@/content/exhibition";
import { galleryMedia, type GalleryMedia } from "@/content/gallery-media";
import { jivanShailiCopy } from "@/content/jivan-shaili";
import { CultureExplorer } from "./culture-explorer";
import "./jivan-gallery.css";

const gujarati = localFont({ src: "../public/fonts/noto-sans-gujarati.woff2", variable: "--jivan-gujarati", display: "swap", weight: "100 900", preload: false });

type Props = {
  section: ExhibitionSection;
  hash: string;
  campusArrived: boolean;
  reducedMotion: boolean;
  exiting: boolean;
  onVisited: (id: number) => void;
};

export function JivanGallery({ section, hash, campusArrived, reducedMotion, exiting, onVisited }: Props) {
  const ready = campusArrived && !exiting;
  const scroller = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const handledHash = useRef<string | null>(null);

  useEffect(() => {
    const viewport = scroller.current;
    if (!ready || !viewport || handledHash.current === hash) return;
    handledHash.current = hash;
    onVisited(section.id);
    const destinations: Record<string, string> = {
      "story-1": "bhojan", "story-2": "culture", "story-3": "bhajan",
      bhasha: "culture", bhusha: "culture", culture: "culture", bhojan: "bhojan", bhajan: "bhajan", closing: "closing",
    };
    const destination = destinations[hash.split("/")[1]];
    const target = destination ? viewport.querySelector<HTMLElement>(`[data-jivan-section="${destination}"]`) : null;
    viewport.scrollTop = target ? target.offsetTop - 28 : 0;
    (target?.querySelector<HTMLElement>("h2, a") ?? heading.current)?.focus({ preventScroll: true });
  }, [hash, ready, onVisited, section.id]);

  useEffect(() => {
    const viewport = scroller.current;
    if (!ready || !viewport || reducedMotion) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animations.push(entry.target.animate(
          [{ opacity: 0.45, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 550, easing: "ease-out" },
        ));
        observer.unobserve(entry.target);
      }
    }, { root: viewport, threshold: 0.12 });
    viewport.querySelectorAll(".jivan-reveal").forEach((element) => observer.observe(element));
    return () => { observer.disconnect(); animations.forEach((animation) => animation.cancel()); };
  }, [ready, reducedMotion]);

  useEffect(() => {
    const viewport = scroller.current;
    const footer = viewport?.querySelector(".jivan-end");
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
    const target = scroller.current?.querySelector<HTMLElement>('[data-jivan-section="culture"]');
    if (!target) return;
    scroller.current?.scrollTo({ top: target.offsetTop - 28, behavior: reducedMotion ? "instant" : "smooth" });
    target.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }

  return (
    <section className={`dome-gallery jivan-gallery ${gujarati.variable} ${ready ? "gallery-ready" : ""} ${exiting ? "gallery-exiting" : ""}`}
      aria-label={`${section.title} exhibition gallery`} aria-hidden={exiting} inert={exiting} data-arrived={ready} data-mode="culture">
      <div className="jivan-room-light" aria-hidden="true" />
      <header className="gallery-header">
        <a href="#map" className="gallery-back"><ArrowLeft size={16} /><span>Back to Campus</span></a>
        <p className="gallery-chapter"><span>EXHIBITION 01</span><span className="gallery-chapter-title">{section.title}</span></p>
        <span className="gallery-header-end" aria-hidden="true">01 <i>/</i> 06</span>
      </header>
      {!ready && !exiting && <p className="gallery-entering" role="status">Entering {section.title}…</p>}
      <div ref={scroller} className="gallery-scroll jivan-scroll" tabIndex={0} role="region" aria-label="Hindu way of life, scroll to explore" inert={!ready} aria-hidden={!ready}>
        <article className="jivan-hero gallery-opening">
          <div className="gallery-copy">
            <p className="gallery-eyebrow">{section.theme}</p>
            <h1 ref={heading} tabIndex={-1}>{section.title}</h1>
            <p className="gallery-caption">{section.message}</p>
            <button className="gallery-scroll-cue" onClick={() => explore()}>Explore a living culture <ArrowDown size={16} /></button>
          </div>
        </article>

        <CultureExplorer reducedMotion={reducedMotion} />

        <section className="jivan-story jivan-bhojan jivan-reveal" data-jivan-section="bhojan" aria-labelledby="bhojan-title">
          <StoryCopy id="bhojan" number="03" copy={jivanShailiCopy.bhojan} />
          <StoryPhoto media={galleryMedia.annakut} caption="Annakut food offerings · BAPS Shri Swaminarayan Mandir, London" />
        </section>
        <section className="jivan-story jivan-bhajan jivan-reveal" data-jivan-section="bhajan" aria-labelledby="bhajan-title">
          <StoryCopy id="bhajan" number="04" copy={jivanShailiCopy.bhajan} />
          <StoryPhoto media={galleryMedia["the-language-of-song"]} caption="Devotional singing · Janmashtami, London, 2023" />
        </section>
        <footer className="jivan-end" data-jivan-section="closing">
          <div><p className="jivan-kicker">Carry this with you</p><h2 tabIndex={-1}>Everyday life. A sense of devotion.</h2><p>{section.takeaways.at(-1)}</p></div>
          <a href="#section-hindu-riti-parampara" className="gallery-next-exhibition">Next Exhibition <ArrowRight size={16} /></a>
          <a className="jivan-source-link" href="/exhibition-source.pdf" target="_blank" rel="noreferrer">Read the exhibition source <ArrowUpRight size={13} /></a>
          <Link className="jivan-source-link" href="/references#jivan-shaili-credits">Map & attire credits <ArrowUpRight size={13} /></Link>
        </footer>
      </div>
    </section>
  );
}

function StoryCopy({ id, number, copy }: { id: string; number: string; copy: typeof jivanShailiCopy.bhojan }) {
  return <div className="jivan-story-copy">
    <p className="jivan-kicker">{number} / {copy.kicker}</p>
    <h2 id={`${id}-title`} tabIndex={-1}>{copy.title}</h2>
    <span className="jivan-rule" aria-hidden="true" />
    <p className="jivan-introduction">{copy.introduction}</p>
    {copy.points.length > 0 && <ul>{copy.points.map((point) => <li key={point}>{point}</li>)}</ul>}
    <p className="jivan-source-label">{copy.sourceLabel}</p>
  </div>;
}

function StoryPhoto({ media, caption }: { media: GalleryMedia; caption: string }) {
  return <figure className="jivan-story-photo">
    <div><Image src={media.src} alt={media.alt} width={media.width} height={media.height} sizes="(max-width: 760px) 88vw, (max-width: 1400px) 46vw, 600px" loading="lazy" /></div>
    <figcaption><span>{caption}</span><a href={media.sourceHref} target="_blank" rel="noreferrer">{media.credit} <ArrowUpRight size={11} /></a></figcaption>
  </figure>;
}
