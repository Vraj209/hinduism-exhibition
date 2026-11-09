"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Grid2X2,
  Image as ImageIcon,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  sections,
  sourcePdfHref,
  type ExhibitionSection,
} from "@/content/exhibition";
import { visualReferences } from "@/content/visual-references";
import { pavilionCarvings } from "@/content/pavilion-carvings";
import { worlds } from "@/content/stories";
import { useAmbientSound } from "./use-ambient-sound";
import { PavilionMark } from "./pavilion-mark";
import "./section-experience.css";

const WorldScene = dynamic(() => import("./world-scene"), { ssr: false });
const PROGRESS_KEY = "hinduism-story-progress-v1";

function storedStory(sectionId: number, count: number) {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PROGRESS_KEY) || "{}",
    )[sectionId];
    return typeof value === "number" && Number.isInteger(value)
      ? Math.max(0, Math.min(count - 1, value))
      : 0;
  } catch {
    return 0;
  }
}

function saveStory(sectionId: number, storyIndex: number) {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    const progress =
      raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ ...progress, [sectionId]: storyIndex }),
    );
  } catch {
    /* Progress is optional; the URL remains the source of current state. */
  }
}

function storyFromHash(hash: string, count: number) {
  const match = /\/story-(\d+)$/.exec(hash);
  if (!match) return null;
  return Math.max(0, Math.min(count - 1, Number(match[1]) - 1));
}

export default function SectionExperience({
  section,
  hash,
  campusArrived,
  reducedMotion,
  mapFallback,
  onVisited,
}: {
  section: ExhibitionSection | null;
  hash: string;
  campusArrived: boolean;
  reducedMotion: boolean;
  mapFallback: boolean;
  onVisited: (id: number) => void;
}) {
  const [retained, setRetained] = useState<ExhibitionSection | null>(section);
  useEffect(() => {
    if (section) {
      const frame = requestAnimationFrame(() => setRetained(section));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => setRetained(null), reducedMotion ? 0 : 400);
    return () => clearTimeout(timer);
  }, [section, reducedMotion]);
  const shown = section ?? retained;
  if (!shown) return null;
  return (
    <WorldExperience
      key={shown.id}
      section={shown}
      hash={hash}
      exiting={!section}
      campusArrived={campusArrived}
      reducedMotion={reducedMotion}
      mapFallback={mapFallback}
      onVisited={onVisited}
    />
  );
}

function WorldExperience({
  section,
  hash,
  exiting,
  campusArrived,
  reducedMotion,
  mapFallback,
  onVisited,
}: {
  section: ExhibitionSection;
  hash: string;
  exiting: boolean;
  campusArrived: boolean;
  reducedMotion: boolean;
  mapFallback: boolean;
  onVisited: (id: number) => void;
}) {
  const world = worlds.find((item) => item.sectionId === section.id)!;
  const explicitStory = storyFromHash(hash, world.stories.length);
  const [resumeStory] = useState(() =>
    typeof window === "undefined"
      ? 0
      : storedStory(section.id, world.stories.length),
  );
  const storyIndex = explicitStory ?? resumeStory;
  const story = world.stories[storyIndex];
  const visualReference = visualReferences[section.id - 1];
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [settledStory, setSettledStory] = useState<number | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [staticMode, setStaticMode] = useState(mapFallback);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const summaryDialog = useRef<HTMLDialogElement>(null);
  const sectionsDialog = useRef<HTMLDialogElement>(null);
  const storyRef = useRef(storyIndex);
  const exitingRef = useRef(exiting);
  const firstArrival = useRef(true);
  const staticScene = staticMode || sceneFailed;
  const environmentVisible =
    !exiting && (staticScene || (campusArrived && sceneReady));
  const arrived =
    environmentVisible &&
    (staticScene || hasEntered || settledStory === storyIndex);
  const audio = useAmbientSound(
    section.id,
    paused || summaryOpen || !arrived || exiting,
  );
  const lastStory = storyIndex === world.stories.length - 1;

  useEffect(() => {
    storyRef.current = storyIndex;
    exitingRef.current = exiting;
  }, [storyIndex, exiting]);

  useEffect(() => {
    if (exiting) return;
    // Normalize entry to an explicit moment so browser Back restores the entry
    // moment instead of accidentally consulting newer saved progress.
    if (explicitStory === null) {
      history.replaceState(
        history.state,
        "",
        `#section-${section.slug}/story-${storyIndex + 1}`,
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
    saveStory(section.id, storyIndex);
  }, [explicitStory, exiting, section.id, section.slug, storyIndex]);

  useEffect(() => {
    if (sceneReady || sceneFailed || staticMode) return;
    const timer = setTimeout(() => setSceneFailed(true), 10000);
    return () => clearTimeout(timer);
  }, [sceneReady, sceneFailed, staticMode]);

  useEffect(() => {
    if (!arrived || exiting) return;
    const frame = requestAnimationFrame(() => {
      if (!summaryDialog.current?.open && !sectionsDialog.current?.open)
        title.current?.focus({ preventScroll: true });
      if (firstArrival.current) {
        onVisited(section.id);
        firstArrival.current = false;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [arrived, exiting, onVisited, section.id, storyIndex]);

  useEffect(() => {
    if (!exiting) return;
    summaryDialog.current?.close();
    sectionsDialog.current?.close();
  }, [exiting]);

  const onReady = useCallback(() => setSceneReady(true), []);
  const onError = useCallback(() => setSceneFailed(true), []);
  const onSettled = useCallback(() => {
    if (!exitingRef.current) {
      setSettledStory(storyRef.current);
      setHasEntered(true);
    }
  }, []);

  function goToStory(index: number) {
    if (index < 0 || index >= world.stories.length || index === storyIndex)
      return;
    setSettledStory(null);
    history.pushState(
      history.state,
      "",
      `#section-${section.slug}/story-${index + 1}`,
    );
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  function openSummary() {
    setSummaryOpen(true);
    summaryDialog.current?.showModal();
  }

  return (
    <section
      className={`world-shell world-${section.id} ${environmentVisible ? "world-visible" : "world-entering"} ${exiting ? "world-exiting" : ""}`}
      aria-label={`${section.title} immersive experience`}
      aria-hidden={exiting}
      inert={exiting}
      data-story={story.id}
      data-arrived={arrived}
      data-static={staticScene}
    >
      <div className="world-stage" aria-hidden="true">
        <div
          className={`world-poster ${staticScene || !sceneReady ? "poster-visible" : ""}`}
        >
          <picture>
            <source
              media="(max-width: 760px) and (min-height: 501px)"
              srcSet={`/worlds/${section.id}-${storyIndex + 1}-mobile.webp`}
            />
            <Image
              key={`${section.id}-${storyIndex}`}
              src={`/worlds/${section.id}-${storyIndex + 1}.webp`}
              alt=""
              fill
              unoptimized
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </picture>
        </div>
        {!staticScene && (
          <WorldScene
            sectionId={section.id}
            storyIndex={storyIndex}
            active={environmentVisible}
            paused={paused || summaryOpen || exiting}
            reducedMotion={reducedMotion}
            onReady={onReady}
            onSettled={onSettled}
            onError={onError}
          />
        )}
      </div>
      <div className="world-scrim" aria-hidden="true" />
      <header className="world-header">
        <a href="#map" className="world-back">
          <ArrowLeft size={17} />
          <span>Back to map</span>
        </a>
        <div className="world-heading">
          <span>
            {String(section.id).padStart(2, "0")} <i>/</i> 06
          </span>
          <h1>{section.title}</h1>
        </div>
        <button
          className="world-sections-button"
          onClick={() => sectionsDialog.current?.showModal()}
        >
          <Grid2X2 size={16} />
          <span>All six sections</span>
        </button>
      </header>

      {!arrived && !exiting && (
        <div className="world-arriving">
          <p role="status">
            <span />
            {environmentVisible
              ? "Let the world settle around you…"
              : `Entering ${section.title}…`}
          </p>
          <button onClick={openSummary}>
            <BookOpen size={15} /> Read summary now <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      <div
        className={`world-copy ${arrived ? "copy-arrived" : ""}`}
        inert={!arrived}
        aria-hidden={!arrived}
      >
        <div className="world-overline">
          <PavilionMark variant={section.id} />
          <span>{world.worldName}</span>
        </div>
        <h2 ref={title} tabIndex={-1} key={story.id}>
          {story.title}
        </h2>
        {story.traditionLabel && (
          <p className="world-tradition">{story.traditionLabel}</p>
        )}
        <p className="world-caption" key={`${story.id}-caption`}>
          {story.caption}
        </p>
        <button className="world-read" onClick={openSummary}>
          <BookOpen size={17} /> Read summary <ArrowUpRight size={14} />
        </button>
        {storyIndex > 0 && <p className="world-takeaway">{story.takeaway}</p>}
      </div>

      {arrived && (
        <button className="world-read world-short-read" onClick={openSummary}>
          <BookOpen size={17} /> Read summary <ArrowUpRight size={14} />
        </button>
      )}
      <div
        className={
          world.stories.length > 3
            ? "world-festival-picker"
            : "world-story-index"
        }
        aria-label="Stories in this section"
        inert={!environmentVisible}
        aria-hidden={!environmentVisible}
      >
        {world.stories.length > 3 ? (
          <label>
            <span>EXPLORE {world.stories.length} FESTIVALS</span>
            <select
              aria-label="Choose a festival"
              value={storyIndex}
              onChange={(event) => goToStory(Number(event.target.value))}
            >
              {world.stories.map((moment, index) => (
                <option key={moment.id} value={index}>
                  {moment.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          world.stories.map((moment, index) => (
            <button
              key={moment.id}
              className={index === storyIndex ? "moment-current" : ""}
              aria-label={`${String(index + 1).padStart(2, "0")} ${moment.title}`}
              aria-current={index === storyIndex ? "step" : undefined}
              onClick={() => goToStory(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i />
              <span className="moment-title">{moment.title}</span>
            </button>
          ))
        )}
      </div>

      <footer
        className="world-controls"
        inert={!environmentVisible}
        aria-hidden={!environmentVisible}
      >
        <nav className="story-navigation" aria-label="Story navigation">
          <button
            onClick={() => goToStory(storyIndex - 1)}
            disabled={storyIndex === 0}
            aria-label="Previous story"
          >
            <ArrowLeft size={17} />
            <span>Previous story</span>
          </button>
          <span className="story-position" aria-live="polite">
            {String(storyIndex + 1).padStart(2, "0")} <i>/</i>{" "}
            {String(world.stories.length).padStart(2, "0")}
          </span>
          {!lastStory ? (
            <button onClick={() => goToStory(storyIndex + 1)}>
              Next story <ArrowRight size={17} />
            </button>
          ) : section.id < 6 ? (
            <a href={`#section-${sections[section.id].slug}`}>
              Next section <ArrowRight size={17} />
            </a>
          ) : (
            <a href="#map">
              Back to map <Check size={17} />
            </a>
          )}
        </nav>
        <div className="atmosphere-controls">
          <button
            aria-pressed={paused || reducedMotion || staticScene}
            disabled={reducedMotion || staticScene}
            title={
              reducedMotion
                ? "Your reduced-motion preference is respected"
                : undefined
            }
            onClick={() => setPaused((value) => !value)}
          >
            {paused || reducedMotion || staticScene ? (
              <Play size={15} />
            ) : (
              <Pause size={15} />
            )}
            <span>
              {reducedMotion || staticScene
                ? "Motion off"
                : paused
                  ? "Resume scene"
                  : "Pause scene"}
            </span>
          </button>
          <button
            aria-pressed={audio.enabled}
            disabled={!audio.available}
            onClick={() => void audio.toggle()}
          >
            {audio.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Sound {audio.enabled ? "on" : "off"}</span>
          </button>
          <button
            aria-pressed={staticScene}
            onClick={() => {
              setStaticMode(!staticScene);
              if (sceneFailed) setSceneFailed(false);
              setSettledStory(null);
            }}
          >
            <ImageIcon size={16} />
            <span>{staticScene ? "3D scene" : "Static scene"}</span>
          </button>
        </div>
        <p className="world-interpretation">
          <Link href="/references">
            Original architecture · Sources & visual credits ↗
          </Link>
        </p>
        {audio.error && (
          <p className="world-audio-error" role="status">
            {audio.error}
          </p>
        )}
      </footer>

      <dialog
        ref={summaryDialog}
        className="world-summary"
        aria-labelledby="world-summary-title"
        onClose={() => setSummaryOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            summaryDialog.current?.close();
        }}
      >
        <div className="world-dialog-header">
          <span>A MOMENT TO UNDERSTAND</span>
          <button
            aria-label="Close summary"
            onClick={() => summaryDialog.current?.close()}
          >
            <X size={21} />
          </button>
        </div>
        <div className="world-summary-content">
          <p className="summary-chapter">
            {section.title} · {String(storyIndex + 1).padStart(2, "0")} /{" "}
            {String(world.stories.length).padStart(2, "0")}
          </p>
          <PavilionMark variant={section.id} className="summary-section-icon" />
          <h2 id="world-summary-title">{story.title}</h2>
          <p className="summary-caption">{story.caption}</p>
          <p>{story.summary}</p>
          <div className="summary-takeaway">
            <span>TAKE THIS WITH YOU</span>
            <p>{story.takeaway}</p>
          </div>
          <details className="section-context" open>
            <summary>
              The whole section <ChevronRight size={15} />
            </summary>
            <h3>{section.title}</h3>
            <p className="summary-message">{section.message}</p>
            <p>{section.summary}</p>
            <ul>
              {section.takeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="summary-reflection">{section.reflection}</p>
          </details>
          <details className="scene-context">
            <summary>
              About this scene <PlusIcon />
            </summary>
            <p>{story.visualDescription}</p>
            <p>
              <strong>{pavilionCarvings[section.id - 1].title}</strong>
              <br />
              {pavilionCarvings[section.id - 1].description}
            </p>
            {story.visualSource && (
              <a href={story.visualSource} target="_blank" rel="noreferrer">
                Official reference for this visual context ↗
              </a>
            )}
            <p>{world.sourceNote}</p>
            <p>
              <strong>{visualReference.title}</strong>
              <br />
              {visualReference.material}
            </p>
            <a href={visualReference.url} target="_blank" rel="noreferrer">
              Architectural reference · {visualReference.credit} ↗
            </a>
          </details>
          <a
            className="world-source-link"
            href={story.sourceHref ?? `${sourcePdfHref}#page=1`}
            target="_blank"
            rel="noreferrer"
          >
            {story.sourceLabel} <ArrowUpRight size={14} />
          </a>
          {story.references && (
            <div className="festival-sources">
              <p>Additional festival research</p>
              {story.references.map((url, index) => (
                <a href={url} key={url} target="_blank" rel="noreferrer">
                  {index === 0
                    ? "Official BAPS festival guide"
                    : `Supporting official reference ${index}`}{" "}
                  ↗
                </a>
              ))}
              <a href={`${sourcePdfHref}#page=1`}>
                Original exhibition theme · PDF page 1 ↗
              </a>
            </div>
          )}
          <Link className="summary-read-all" href={`/read#${section.slug}`}>
            Read all sections and stories <BookOpen size={15} />
          </Link>
          <div className="summary-section-navigation">
            {section.id > 1 ? (
              <a href={`#section-${sections[section.id - 2].slug}`}>
                <ArrowLeft size={14} /> Previous section
              </a>
            ) : (
              <a href="#map">
                <ArrowLeft size={14} /> Back to map
              </a>
            )}
            {section.id < 6 ? (
              <a href={`#section-${sections[section.id].slug}`}>
                Next section <ArrowRight size={14} />
              </a>
            ) : (
              <a href="#map">
                Complete journey <Check size={14} />
              </a>
            )}
          </div>
        </div>
      </dialog>
      <dialog
        ref={sectionsDialog}
        className="world-section-menu"
        aria-labelledby="world-sections-title"
        onClick={(event) => {
          if (event.target === event.currentTarget)
            sectionsDialog.current?.close();
        }}
      >
        <div className="world-dialog-header">
          <span>THE EXHIBITION</span>
          <button
            aria-label="Close sections"
            onClick={() => sectionsDialog.current?.close()}
          >
            <X size={21} />
          </button>
        </div>
        <h2 id="world-sections-title">
          Six spaces.
          <br />A world within each.
        </h2>
        <nav aria-label="Choose a section">
          {sections.map((item) => (
            <a
              key={item.id}
              href={`#section-${item.slug}${item.id === section.id ? `/story-${storyIndex + 1}` : ""}`}
              aria-current={item.id === section.id ? "page" : undefined}
              onClick={() => sectionsDialog.current?.close()}
            >
              <span>{String(item.id).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.theme}</p>
              </div>
              <PavilionMark variant={item.id} />
            </a>
          ))}
        </nav>
        <Link href="/read" className="world-menu-reading">
          <BookOpen size={16} /> Read all sections <ArrowUpRight size={14} />
        </Link>
      </dialog>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M8 3v10M3 8h10" stroke="currentColor" />
    </svg>
  );
}
