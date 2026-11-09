"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowDown, ArrowUpRight, BookOpen, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { sections, sourcePdfHref, type ExhibitionSection } from "@/content/exhibition";
import { galleryForSection, type GalleryMoment } from "@/content/gallery-stories";
import { worlds } from "@/content/stories";
import { galleryFrame, galleryHash, galleryIndexFromHash } from "@/lib/gallery-scroll";
import { PavilionMark } from "./pavilion-mark";
import "./dome-gallery.css";

const FLOW_QUERY = "(max-width: 760px), (max-height: 600px), (prefers-reduced-motion: reduce)";
const subscribeFlow = (callback: () => void) => {
  const query = window.matchMedia(FLOW_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const readFlow = () => window.matchMedia(FLOW_QUERY).matches;
const serverFlow = () => true;

type Props = {
  section: ExhibitionSection | null;
  hash: string;
  campusArrived: boolean;
  reducedMotion: boolean;
  onVisited: (id: number) => void;
};

export default function SectionExperience(props: Props) {
  const [retained, setRetained] = useState(props.section);
  useEffect(() => {
    if (props.section) {
      const frame = requestAnimationFrame(() => setRetained(props.section));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => setRetained(null), props.reducedMotion ? 0 : 450);
    return () => clearTimeout(timer);
  }, [props.section, props.reducedMotion]);
  const shown = props.section ?? retained;
  return shown ? (
    <div className={`gallery-container ${!props.section ? "gallery-container-exiting" : ""}`}>
      <DomeGallery {...props} key={shown.id} section={shown} exiting={!props.section} />
    </div>
  ) : null;
}

function DomeGallery({ section, hash, campusArrived, reducedMotion, onVisited, exiting }: Props & { section: ExhibitionSection; exiting: boolean }) {
  const moments = useMemo(() => galleryForSection(section), [section]);
  const flow = useSyncExternalStore(subscribeFlow, readFlow, serverFlow);
  const [activeIndex, setActiveIndex] = useState(() => galleryIndexFromHash(hash, moments.length - 2));
  const scroller = useRef<HTMLDivElement>(null);
  const articles = useRef<(HTMLElement | null)[]>([]);
  const summary = useRef<HTMLDialogElement>(null);
  const publishedHash = useRef(hash);
  const indexRef = useRef(activeIndex);
  const initialized = useRef(false);
  const ready = campusArrived && !exiting;

  const scrollToMoment = useCallback((index: number, behavior: ScrollBehavior = "instant") => {
    const viewport = scroller.current;
    if (!viewport) return;
    const target = Math.max(0, Math.min(moments.length - 1, index));
    const top = flow
      ? (articles.current[target]?.offsetTop ?? 0)
      : target * viewport.clientHeight * 1.15;
    viewport.scrollTo({ top, behavior });
  }, [flow, moments.length]);

  // Scroll replaces the current history entry; it never floods the Back stack.
  useEffect(() => {
    if (exiting || hash.split("/")[0] !== `#section-${section.slug}`) return;
    if (initialized.current && hash === publishedHash.current) return;
    publishedHash.current = hash;
    initialized.current = true;
    indexRef.current = galleryIndexFromHash(hash, moments.length - 2);
    scrollToMoment(indexRef.current);
  }, [hash, exiting, section.slug, moments.length, scrollToMoment]);

  useEffect(() => {
    const viewport = scroller.current;
    if (!viewport) return;
    let frame = 0;
    let first = true;
    const update = () => {
      frame = 0;
      const position = viewport.scrollTop / (viewport.clientHeight * 1.15);
      let current = Math.max(0, Math.min(moments.length - 1, Math.round(position)));
      if (flow) {
        const readingLine = viewport.scrollTop + viewport.clientHeight * 0.45;
        current = 0;
        articles.current.forEach((article, index) => {
          if (article && article.offsetTop <= readingLine) current = index;
        });
      }
      articles.current.forEach((article, index) => {
        if (!article) return;
        const visual = galleryFrame(index - position);
        article.style.setProperty("--moment-opacity", String(visual.opacity));
        article.style.setProperty("--copy-opacity", String(visual.copyOpacity));
        article.style.setProperty("--moment-z", `${visual.z}px`);
        article.style.setProperty("--moment-y", `${visual.y}px`);
      });
      if (first || indexRef.current !== current) {
        first = false;
        indexRef.current = current;
        setActiveIndex(current);
        if (!exiting) {
          const next = galleryHash(section.slug, current, moments.length);
          if (window.location.hash !== next) {
            publishedHash.current = next;
            history.replaceState(history.state, "", next);
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          }
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    let previousHeight = viewport.clientHeight;
    const resize = new ResizeObserver(() => {
      const height = viewport.clientHeight;
      // Mobile browser chrome can resize the viewport during a gesture. Let
      // native vertical scrolling retain its reading offset; never snap it.
      if (!flow && previousHeight && height !== previousHeight) {
        viewport.scrollTop = viewport.scrollTop / previousHeight * height;
      }
      previousHeight = height;
      schedule();
    });
    resize.observe(viewport);
    viewport.addEventListener("scroll", schedule, { passive: true });
    scrollToMoment(indexRef.current);
    update();
    return () => {
      viewport.removeEventListener("scroll", schedule);
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [flow, moments.length, section.slug, exiting, scrollToMoment]);

  useEffect(() => {
    if (!ready) return;
    onVisited(section.id);
    articles.current[indexRef.current]?.querySelector<HTMLElement>("h1, h2")?.focus({ preventScroll: true });
  }, [ready, onVisited, section.id]);

  useEffect(() => {
    if (exiting) summary.current?.close();
  }, [exiting]);

  function go(index: number) {
    scrollToMoment(index, reducedMotion || flow ? "instant" : "smooth");
  }

  return (
    <section
      className={`dome-gallery world-shell ${ready ? "gallery-ready" : ""} ${exiting ? "gallery-exiting" : ""}`}
      aria-label={`${section.title} exhibition gallery`}
      aria-hidden={exiting}
      inert={exiting}
      data-arrived={ready}
      data-story={moments[activeIndex].id}
      data-mode={flow ? "vertical" : "depth"}
    >
      <div className="gallery-room" aria-hidden="true"><div className="gallery-floor" /></div>
      <header className="gallery-header">
        <a href="#map" className="gallery-back"><ArrowLeft size={16} /><span>Back to Campus</span></a>
        <p className="gallery-chapter"><span>EXHIBITION {String(section.id).padStart(2, "0")}</span><span className="gallery-chapter-title">{section.title}</span></p>
        <span className="gallery-header-end" aria-hidden="true">{String(section.id).padStart(2, "0")} <i>/</i> 06</span>
      </header>
      {!ready && !exiting && <p className="gallery-entering" role="status">Entering {section.title}…</p>}
      <div ref={scroller} className="gallery-scroll" role="region" aria-label="Exhibition story, scroll to discover" tabIndex={0} inert={!ready} aria-hidden={!ready}>
        <div className="gallery-track" style={{ "--moment-count": moments.length } as CSSProperties}>
          <div className="gallery-stage">
            {moments.map((moment, index) => (
              <article
                key={moment.id}
                ref={(element) => { articles.current[index] = element; }}
                className={`gallery-moment gallery-${moment.kind} gallery-layout-${index % 3 === 0 ? "portrait" : index % 2 === 0 ? "reverse" : "split"}`}
                data-active={index === activeIndex}
                data-moment={index}
                aria-hidden={!flow && index !== activeIndex}
                inert={!flow && index !== activeIndex}
                aria-labelledby={`gallery-title-${index}`}
              >
                {moment.media && <GalleryImage moment={moment} load={flow || Math.abs(index - activeIndex) <= 1} />}
                <div className="gallery-copy">
                  <p className="gallery-eyebrow">{moment.kind === "opening" ? section.theme : moment.kind === "closing" ? "TAKE THIS WITH YOU" : `${String(index).padStart(2, "0")} / ${String(moments.length - 2).padStart(2, "0")} · ${section.theme}`}</p>
                  {moment.kind === "opening" ? (
                    <h1 id={`gallery-title-${index}`} tabIndex={-1}>{section.title}</h1>
                  ) : <h2 id={`gallery-title-${index}`} tabIndex={-1}>{moment.title}</h2>}
                  <p className="gallery-caption">{moment.caption}</p>
                  {moment.kind === "opening" && <button className="gallery-scroll-cue" onClick={() => go(1)}>Scroll to Discover <ArrowDown size={16} /></button>}
                  {moment.kind === "closing" && (
                    <div className="gallery-ending-actions">
                      <a className="gallery-next-exhibition" href={`#section-${sections[section.id % sections.length].slug}`}>Next Exhibition <ArrowRight size={16} /></a>
                      <div>
                        <a href="#map">Return to Campus</a>
                        <button onClick={() => summary.current?.showModal()}><BookOpen size={15} />Read Full Summary</button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <footer className="gallery-footer" inert={!ready}>
        <div className="gallery-progress" aria-label="Exhibition progress" role="progressbar" aria-valuemin={1} aria-valuemax={moments.length} aria-valuenow={activeIndex + 1} aria-valuetext={`${activeIndex + 1} of ${moments.length}: ${moments[activeIndex].title}`}>
          <span>{String(activeIndex + 1).padStart(2, "0")} <i>/</i> {String(moments.length).padStart(2, "0")}</span>
          <div aria-hidden="true">{moments.map((moment, index) => <i key={moment.id} className={index <= activeIndex ? "is-read" : ""} />)}</div>
        </div>
        <p className="gallery-current-label" aria-hidden="true">{moments[activeIndex].kind === "opening" ? "A journey of discovery" : moments[activeIndex].title}</p>
        <nav aria-label="Story navigation">
          <button onClick={() => go(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous story"><ArrowLeft size={17} /><span>Previous</span></button>
          <button onClick={() => go(activeIndex + 1)} disabled={activeIndex === moments.length - 1} aria-label="Next story"><span>Next</span><ArrowRight size={17} /></button>
        </nav>
      </footer>
      <span className="gallery-sr-only" role="status">{moments[activeIndex].title}, {activeIndex + 1} of {moments.length}</span>
      <GallerySummary section={section} moments={moments} dialogRef={summary} />
    </section>
  );
}

function GalleryImage({ moment, load }: { moment: GalleryMoment; load: boolean }) {
  const media = moment.media!;
  return (
    <figure className="gallery-figure">
      <div className="gallery-image-frame">
        {load && <picture>
          {media.mobileSrc && <source media="(max-width: 760px)" srcSet={media.mobileSrc} />}
          <Image src={media.src} alt={media.alt} width={media.width ?? 1440} height={media.height ?? 900} unoptimized loading="lazy" sizes="(max-width: 760px) 90vw, 54vw" />
        </picture>}
      </div>
      <figcaption>{media.sourceHref ? <a href={media.sourceHref} target="_blank" rel="noreferrer">{media.credit} <ArrowUpRight size={11} /></a> : media.credit}</figcaption>
    </figure>
  );
}

function GallerySummary({ section, moments, dialogRef }: { section: ExhibitionSection; moments: GalleryMoment[]; dialogRef: RefObject<HTMLDialogElement | null> }) {
  const world = worlds.find((item) => item.sectionId === section.id)!;
  return (
    <dialog ref={dialogRef} className="gallery-summary" aria-labelledby="gallery-summary-title" onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
      <div className="gallery-summary-header"><span>THE FULL EXHIBITION</span><button aria-label="Close summary" onClick={() => dialogRef.current?.close()}><X size={22} /></button></div>
      <div className="gallery-summary-body">
        <PavilionMark variant={section.id} />
        <h2 id="gallery-summary-title">{section.title}</h2>
        <p className="gallery-summary-lead">{section.message}</p>
        <p>{section.summary}</p>
        <ul>{section.takeaways.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="gallery-source-note">{world.sourceNote}</p>
        {moments.filter((moment) => moment.story).map((moment) => <section key={moment.id}>
          <h3>{moment.title}</h3>
          {moment.story!.traditionLabel && <p className="gallery-source-note">{moment.story!.traditionLabel}</p>}
          <p>{moment.story!.summary}</p>
          <a href={moment.story!.sourceHref ?? `${sourcePdfHref}#page=1`} target="_blank" rel="noreferrer">{moment.story!.sourceLabel} <ArrowUpRight size={13} /></a>
          {moment.media && <p className="gallery-source-note">{moment.media.kind === "illustration" ? moment.story!.visualDescription : `${moment.media.sourceContext}. ${moment.media.alt}`} {moment.media.sourceHref && <a href={moment.media.sourceHref} target="_blank" rel="noreferrer">{moment.media.credit} ↗</a>}</p>}
        </section>)}
        <p className="gallery-summary-reflection">{section.reflection}</p>
        <Link href={`/read#${section.slug}`}>Read all six exhibitions <ArrowUpRight size={14} /></Link>
        <Link href="/references">Sources & visual credits <ArrowUpRight size={14} /></Link>
      </div>
    </dialog>
  );
}
