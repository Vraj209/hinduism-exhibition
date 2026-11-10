"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  DoorOpen,
  Footprints,
  Grid2X2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Square,
  X,
} from "lucide-react";
import {
  sections,
  sourcePdfHref,
  exhibitionSourceNote,
} from "@/content/exhibition";
import { PavilionMark, MandirMark } from "./pavilion-mark";
import { FallbackMap, fallbackPositions } from "./fallback-map";
import { useCampusAmbience } from "./use-campus-ambience";
import { CampusAmbienceControls } from "./campus-ambience-controls";
import { HeroTitle } from "./hero-title";
import { SectionMenu } from "./section-menu";
import { CampusWelcome } from "./campus-welcome";
import { INITIAL_WALK_STATE, type WalkCommand, type WalkState } from "@/lib/campus-walk";
import "./campus-environment.css";
import "./campus-hero.css";
import "./campus-walk.css";

const SectionExperience = dynamic(() => import("./section-experience"), {
  ssr: false,
});

const CampusScene = dynamic(() => import("./campus-scene"), { ssr: false });
const readHash = () => window.location.hash;
const serverHash = () => "";
const subscribeMotion = (callback: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const readMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotion = () => false;
type Position = { id: number; x: number; y: number; visible: boolean };

export default function Exhibition() {
  const [settled, setSettled] = useState<number | null>(null);
  const subscribeRoute = useCallback((callback: () => void) => {
    let previousBase = window.location.hash.split("/")[0];
    const update = () => {
      const base = window.location.hash.split("/")[0];
      if (base !== previousBase) {
        setSettled(null);
        previousBase = base;
      }
      callback();
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const hash = useSyncExternalStore(subscribeRoute, readHash, serverHash);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const active =
    sections.find(
      (section) => hash.split("/")[0] === `#section-${section.slug}`,
    ) ?? null;
  const isMap = hash === "#map" || !!active;
  const [hovered, setHovered] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  const [failed, setFailed] = useState(false);
  const [simpleMap, setSimpleMap] = useState(false);
  const [environmentPaused, setEnvironmentPaused] = useState(false);
  const [positions, setPositions] = useState<Position[]>(fallbackPositions);
  const [visited, setVisited] = useState<number[]>([]);
  const [zoom, setZoom] = useState(1);
  const [lookOffset, setLookOffset] = useState(0);
  const [campusView, setCampusView] = useState<"arrival" | "map">("arrival");
  const [walking, setWalking] = useState(false);
  const [walkCommand, setWalkCommand] = useState<WalkCommand | null>(null);
  const [walkState, setWalkState] = useState<WalkState>(INITIAL_WALK_STATE);
  const walkSequence = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 900, height: 650 });
  const about = useRef<HTMLDialogElement>(null);
  const previousActive = useRef<number | null>(null);
  const pendingReturnFocus = useRef<number | null>(null);
  const restoreWelcomeFocus = useRef(false);
  const fallback = failed || simpleMap;
  const ambience = useCampusAmbience({
    outdoors: !active || (!fallback && ready && settled !== active.id),
  });

  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setStageSize({ width: width || 900, height: height || 650 });
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  const imageScale = Math.min(stageSize.width / 900, stageSize.height / 650);
  const imagePositions = fallbackPositions.map((point) => ({
    ...point,
    x:
      (((point.x / 100) * 900 * imageScale +
        (stageSize.width - 900 * imageScale) / 2) /
        stageSize.width) *
      100,
    y:
      (((point.y / 100) * 650 * imageScale +
        (stageSize.height - 650 * imageScale) / 2) /
        stageSize.height) *
      100,
  }));

  useEffect(() => {
    if (active) {
      pendingReturnFocus.current = null;
    } else if (previousActive.current) {
      pendingReturnFocus.current = previousActive.current;
    }
    if (active || previousActive.current) {
      requestAnimationFrame(() => {
        document
          .querySelector(".experience")
          ?.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
    previousActive.current = active?.id ?? null;
  }, [active]);

  useEffect(() => {
    if (active || !welcomeComplete || pendingReturnFocus.current === null) return;
    // The renderer publishes its final phase before React commits the matching
    // projected pins. Allow that commit before deciding a pin is off screen.
    let commitFrame = 0;
    const frame = requestAnimationFrame(() => {
      const canvas = stage.current?.querySelector("canvas");
      if (!fallback && !walking && canvas?.dataset.cameraPhase !== "overview") return;
      commitFrame = requestAnimationFrame(() => {
        if (pendingReturnFocus.current === null) return;
        const pin = document.getElementById(`destination-${pendingReturnFocus.current}`);
        const visiblePin = pin && getComputedStyle(pin).visibility === "visible" && getComputedStyle(pin).display !== "none";
        const target = walking
          ? campusView === "arrival"
            ? stage.current?.querySelector<HTMLElement>(".campus-webgl")
            : document.getElementById("walk-map-toggle")
          : visiblePin ? pin : document.getElementById("section-selector");
        target?.focus({ preventScroll: true });
        if (document.activeElement === target) pendingReturnFocus.current = null;
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(commitFrame);
    };
  }, [active, positions, fallback, walking, campusView, welcomeComplete]);

  useEffect(() => {
    if (!welcomeComplete || active || !restoreWelcomeFocus.current) return;
    restoreWelcomeFocus.current = false;
    if (document.activeElement === document.body) {
      document.querySelector<HTMLButtonElement>(".hero-lightweight")?.focus({ preventScroll: true });
    }
  }, [welcomeComplete, active]);

  useEffect(() => {
    const restore = requestAnimationFrame(() => {
      try {
        const saved: unknown = JSON.parse(
          localStorage.getItem("hinduism-visited") || "[]",
        );
        if (Array.isArray(saved))
          setVisited(
            saved.filter(
              (id): id is number =>
                typeof id === "number" && id >= 1 && id <= 6,
            ),
          );
      } catch {
        /* Storage is optional. */
      }
    });
    return () => cancelAnimationFrame(restore);
  }, []);

  useEffect(() => {
    if (ready || fallback) return;
    const timer = setTimeout(() => { setFailed(true); setWelcomeComplete(true); }, 12000);
    return () => clearTimeout(timer);
  }, [ready, fallback]);

  useEffect(() => {
    if (!active) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [active]);

  const markVisited = useCallback((id: number) => {
    setVisited((previous) => {
      if (previous.includes(id)) return previous;
      const next = [...previous, id];
      try {
        localStorage.setItem("hinduism-visited", JSON.stringify(next));
      } catch {
        /* Optional. */
      }
      return next;
    });
  }, []);

  const navigate = useCallback((id: number) => {
    const targetHash = `#section-${sections[id - 1].slug}`;
    if (window.location.hash.split("/")[0] === targetHash) return;
    setHovered(null);
    setSettled(null);
    window.location.hash = targetHash;
    // Synchronize the route subscriber before React renders this event's state
    // updates. Otherwise the later native hashchange can clear an instant
    // reduced-motion arrival that has already completed on the next frame.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onWelcomeComplete = useCallback(() => setWelcomeComplete(true), []);
  const onError = useCallback(() => { setReady(false); setFailed(true); setWelcomeComplete(true); }, []);
  const onSettled = useCallback((id: number | null) => {
    const routeId =
      sections.find(
        (item) =>
          `#section-${item.slug}` === window.location.hash.split("/")[0],
      )?.id ?? null;
    if (id !== routeId) return;
    setSettled(id);
  }, []);
  const onPositions = useCallback((next: Position[]) => setPositions(next), []);
  const onWalkChange = useCallback((next: WalkState) => setWalkState(next), []);
  const commandWalk = useCallback((type: WalkCommand["type"], id?: number) => {
    setWalkCommand({ sequence: ++walkSequence.current, type, id });
  }, []);
  const focusWalk = useCallback(() => {
    requestAnimationFrame(() => {
      stage.current?.parentElement?.scrollIntoView({ behavior: "instant", block: "start" });
      stage.current?.querySelector<HTMLElement>(".campus-webgl")?.focus({ preventScroll: true });
    });
  }, []);
  const startWalking = () => {
    setCampusView("arrival");
    setZoom(1);
    setWalking(true);
    commandWalk("entrance");
    focusWalk();
  };
  const exitWalking = () => {
    commandWalk("stop");
    setWalking(false);
    setCampusView("arrival");
    setLookOffset(0);
    setZoom(1);
    if (active) window.location.hash = "#map";
    requestAnimationFrame(() => document.getElementById("walk-around")?.focus({ preventScroll: true }));
  };
  const returnToEntrance = () => {
    setCampusView("arrival");
    if (active) window.location.hash = "#map";
    commandWalk("entrance");
    focusWalk();
  };
  const openWalkMap = () => {
    commandWalk("stop");
    setCampusView("map");
    if (active) window.location.hash = "#map";
  };
  const selectDestination = useCallback((id: number) => {
    if (walking && !fallback) {
      setHovered(null);
      setCampusView("arrival");
      commandWalk("dome", id);
      focusWalk();
    } else navigate(id);
  }, [walking, fallback, commandWalk, focusWalk, navigate]);
  const walkingOutside = walking && !fallback && !active;
  const nearbySection = walkState.nearDome === null ? null : sections[walkState.nearDome - 1];

  return (
    <>
      <a className="skip-link" href="/read">
        Skip to all exhibition content
      </a>
      <main id="main-content" inert={!!active} aria-hidden={!!active}>
        <section
          className={`experience campus-hero ${isMap ? "map-mode" : "arrival-mode"} ${active ? "section-mode" : ""}`}
          aria-label="Interactive exhibition campus"
          data-view={campusView}
          data-fallback={fallback}
          data-walking={walking && !fallback}
          data-welcoming={!welcomeComplete}
          data-campus-ready={ready || fallback}
          aria-busy={!ready && !fallback}
        >
          {!active && <HeroTitle ariaHidden={!welcomeComplete} />}
          {!welcomeComplete && <CampusWelcome ready={ready} reducedMotion={reducedMotion} onComplete={onWelcomeComplete} />}

          {walkingOutside && (
            <div className="walk-toolbar">
              <div className="walk-guidance">
                <span><Footprints size={15} /> Walk Around</span>
                <p className="walk-desktop-hint">WASD / arrows to walk · Q/E to turn · R/F to look · Home to level · drag to look or click a path</p>
                <p className="walk-touch-hint">Tap a path to walk · drag to look around</p>
                {campusView === "map" && <p>Walking is paused while you explore the map.</p>}
              </div>
              <div className="walk-toolbar-actions" role="group" aria-label="Walking controls">
                <button type="button" className="walk-control" onClick={exitWalking}><X size={15} /><span>Exit Walk Mode</span></button>
                <button id="walk-map-toggle" type="button" className="walk-control" aria-pressed={campusView === "map"} onClick={() => { if (campusView === "map") { setCampusView("arrival"); focusWalk(); } else openWalkMap(); }}><Compass size={15} /><span>{campusView === "map" ? "Resume Walk" : "Campus Map"}</span></button>
                <button type="button" className="walk-control" onClick={returnToEntrance}><RotateCcw size={15} /><span>Return to Entrance</span></button>
              </div>
            </div>
          )}

          <div className="campus-stage" ref={stage} inert={!welcomeComplete} aria-hidden={!welcomeComplete}>
            {fallback && <div className="fallback-layer">
              <FallbackMap />
            </div>}
            {!fallback && (
              <CampusScene
                selected={active?.id ?? null}
                hovered={hovered}
                reducedMotion={reducedMotion}
                environmentPaused={environmentPaused}
                view={campusView}
                zoom={zoom}
                lookOffset={lookOffset}
                walking={walking}
                walkCommand={walkCommand}
                onWalkChange={onWalkChange}
                onLookChange={setLookOffset}
                onReady={onReady}
                onError={onError}
                onSettled={onSettled}
                onPositions={onPositions}
                onSelect={selectDestination}
                onEnvironment={ambience.updateEnvironment}
              />
            )}
            {!active && (
              <div
                className="map-labels"
                aria-label="Six exhibition destinations"
              >
                {(fallback ? imagePositions : positions).map(
                  (position) => {
                    const section = sections[position.id - 1];
                    // Keep visible markers and their titles inside the viewport.
                    // Visibility still comes from the camera; offscreen domes are never pulled into view.
                    const projectedX = (position.x / 100) * stageSize.width;
                    const anchorX = Math.max(19, Math.min(stageSize.width - 19, projectedX));
                    const titleHalfWidth = stageSize.width <= 1000 ? 62 : 77;
                    const titleCenter = Math.max(titleHalfWidth + 8, Math.min(stageSize.width - titleHalfWidth - 8, anchorX));
                    const titleShift = titleCenter - anchorX;
                    return (
                      <a
                        key={position.id}
                        id={`destination-${position.id}`}
                        href={`#section-${section.slug}`}
                        className={`map-pin pin-${position.id} ${hovered === position.id ? "pin-active" : ""}`}
                        style={{
                          left: `${(anchorX / stageSize.width) * 100}%`,
                          top: `${position.y}%`,
                          visibility: position.visible ? "visible" : "hidden",
                        }}
                        onMouseEnter={() => setHovered(position.id)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(position.id)}
                        onBlur={() => setHovered(null)}
                        onClick={(event) => {
                          if (walking && !fallback && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                            event.preventDefault();
                            selectDestination(position.id);
                          }
                        }}
                        aria-label={`${walking && !fallback ? "Walk to " : ""}${String(position.id).padStart(2, "0")} ${section.title}. ${section.message}`}
                      >
                        <span className="pin-number">
                          {String(position.id).padStart(2, "0")}
                        </span>{" "}
                        <span className="pin-title" style={{ left: `calc(50% + ${titleShift}px)` }}>
                          {section.title}
                          {visited.includes(section.id) && (
                            <Check size={11} aria-label="Visited" />
                          )}
                        </span>
                      </a>
                    );
                  },
                )}
              </div>
            )}
          </div>

          {!active && (
            <div className="hero-dock" inert={!welcomeComplete}>
              {!walking && !fallback && (
                <button id="walk-around" className="walk-start" type="button" disabled={!ready} onClick={startWalking}>
                  <Footprints size={18} /> Walk Around <ArrowRight size={16} />
                </button>
              )}
              {walkingOutside && (
                <div className="walk-progress">
                  {nearbySection && !walkState.automatic && campusView === "arrival" ? (
                    <div className="walk-entrance-card">
                      <div><span>DOME {String(nearbySection.id).padStart(2, "0")}</span><strong>{nearbySection.title}</strong></div>
                      <button type="button" className="walk-control walk-primary" onClick={() => navigate(nearbySection.id)}><DoorOpen size={16} /> Enter Exhibition</button>
                    </div>
                  ) : (
                    <p className="walk-status" role="status">{walkState.status}</p>
                  )}
                  {walkState.automatic && (
                    <div className="walk-route-actions">
                      <span>{Math.ceil(walkState.distanceRemaining)} m remaining</span>
                      <button type="button" className="walk-control walk-stop" onClick={() => commandWalk("stop")}><Square size={13} /> Stop</button>
                      <button type="button" className="walk-control" onClick={() => commandWalk("direct")}><ArrowRight size={15} /> Go Directly</button>
                    </div>
                  )}
                </div>
              )}
              <div className="hero-navigation-row">
                <div className="hero-section-selector">
                  <label htmlFor="section-selector">{walkingOutside ? "WALK TO AN EXHIBITION" : "YOUR JOURNEY"}</label>
                  <SectionMenu
                    id="section-selector"
                    label="Choose an exhibition section"
                    placeholder={walkingOutside ? "Walk to a dome · 6 destinations" : "Choose a section · 6 destinations"}
                    heading={walkingOutside ? "Walk to an exhibition" : "Explore the exhibition"}
                    visited={visited}
                    onSelect={selectDestination}
                  />
                </div>
                {walkingOutside && (
                  <div className="hero-section-selector walk-direct-selector">
                    <label htmlFor="direct-section-selector">OR OPEN A SECTION DIRECTLY</label>
                    <SectionMenu id="direct-section-selector" label="Open a section directly" placeholder="Open a section directly"
                      heading="Open an exhibition" visited={visited} onSelect={navigate} />
                  </div>
                )}
                <div className="hero-camera-controls" role="group" aria-label="Campus camera controls">
                  {campusView === "arrival" && !fallback && !walkingOutside && (
                    <div className="hero-look-controls">
                      <button type="button" className="hero-control hero-icon-control" aria-label="Look left" title="Look left" disabled={lookOffset <= -0.48} onClick={() => setLookOffset((value) => Math.max(-0.48, value - 0.1))}>
                        <ArrowLeft size={16} />
                      </button>
                      <span className="hero-look-hint">Drag to look</span>
                      <button type="button" className="hero-control hero-icon-control" aria-label="Look right" title="Look right" disabled={lookOffset >= 0.48} onClick={() => setLookOffset((value) => Math.min(0.48, value + 0.1))}>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                  {campusView === "map" && !fallback && (
                    <div className="hero-look-controls">
                      <button type="button" className="hero-control hero-icon-control" aria-label="Zoom out" disabled={zoom <= 0.8} onClick={() => setZoom((value) => Math.max(0.8, value - 0.1))}><Minus size={16} /></button>
                      <button type="button" className="hero-control hero-icon-control" aria-label="Zoom in" disabled={zoom >= 1.3} onClick={() => setZoom((value) => Math.min(1.3, value + 0.1))}><Plus size={16} /></button>
                    </div>
                  )}
                  {!walkingOutside && <><button type="button" className="hero-control hero-map-toggle" disabled={fallback} onClick={() => setCampusView((current) => current === "map" ? "arrival" : "map")} aria-pressed={campusView === "map"}>
                    <Compass size={15} /><span>{campusView === "map" ? "Entrance View" : "Campus Map"}</span>
                  </button>
                  <button type="button" className="hero-control" disabled={fallback} onClick={() => { setZoom(1); setLookOffset(0); setCampusView("arrival"); }}>
                    <RotateCcw size={14} /><span>Reset View</span>
                  </button></>}
                  <button type="button" className="hero-control hero-icon-control hero-lightweight" aria-label={fallback ? "Enable 3D map" : "Use lightweight map"} title={fallback ? "Enable 3D map" : "Use lightweight map"} aria-pressed={fallback} onClick={() => { if (walking) exitWalking(); restoreWelcomeFocus.current = fallback; setReady(false); setFailed(false); setWelcomeComplete(!fallback); setSimpleMap(!fallback); }}>
                    <Grid2X2 size={15} />
                  </button>
                </div>
              </div>
              <div className="campus-environment-bar hero-environment-row">
                <button
                  className="garden-motion-button"
                  aria-pressed={environmentPaused || reducedMotion}
                  disabled={reducedMotion || fallback}
                  onClick={() => setEnvironmentPaused((paused) => !paused)}
                >
                  {environmentPaused || reducedMotion ? <Play size={13} /> : <Pause size={13} />}
                  {reducedMotion ? "Reduced motion" : environmentPaused ? "Resume garden motion" : "Pause garden motion"}
                </button>
                <CampusAmbienceControls ambience={ambience} />
              </div>
            </div>
          )}
        </section>

        <section className="exhibition-index" aria-labelledby="index-title">
          <div className="index-heading">
            <h2 id="index-title">Six windows into a way of life</h2>
            <span>FOLLOW THE PATH. FIND YOUR OWN MEANING.</span>
            <Link href="/read">
              Read all sections <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="destination-grid">
            {sections.map((section) => (
              <a
                className={`destination ${active?.id === section.id ? "destination-active" : ""}`}
                key={section.id}
                href={`#section-${section.slug}`}
                onMouseEnter={() => setHovered(section.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(section.id)}
                onBlur={() => setHovered(null)}
              >
                <div className="destination-top">
                  <span>{String(section.id).padStart(2, "0")}</span>
                  <PavilionMark variant={section.id} />
                  {visited.includes(section.id) && (
                    <Check className="visited-mark" size={12} />
                  )}
                </div>
                <h3>{section.title}</h3>
                <p>{section.theme}</p>
                <ArrowUpRight className="destination-arrow" size={15} />
              </a>
            ))}
          </div>
        </section>
        <footer className="site-footer">
          <p>Rooted in tradition. Open to discovery.</p>
          <span>
            Campus: our exhibition design · Mandir: photo-based reconstruction
          </span>
          <button onClick={() => about.current?.showModal()}>
            About this experience <ArrowUpRight size={13} />
          </button>
        </footer>
      </main>
      <SectionExperience
        section={active}
        hash={hash}
        campusArrived={fallback || settled === active?.id}
        reducedMotion={reducedMotion}
        onVisited={markVisited}
      />

      <dialog
        aria-labelledby="about-title"
        className="about-dialog"
        ref={about}
        onClick={(event) => {
          if (event.target === event.currentTarget) about.current?.close();
        }}
      >
        <button
          className="dialog-close tool"
          aria-label="Close about this exhibition"
          onClick={() => about.current?.close()}
        >
          <X size={20} />
        </button>
        <MandirMark />
        <h2 id="about-title">
          A place to explore.
          <br />A moment to reflect.
        </h2>
        <p>
          This digital exhibition brings together six connected messages about
          Hindu life, traditions, belief, celebrations, values, and the pillars
          that sustain them.
        </p>
        <p>
          {exhibitionSourceNote} The campus follows the exhibition owner’s axial
          arrangement, with six domed pavilions around a fountain garden. The
          landmark is a photo-based reconstruction of BAPS Swaminarayan
          Akshardham Mahamandir in Robbinsville, New Jersey; it is not a
          verified replica or a plan of the real Robbinsville campus.
        </p>
        <p>
          The final section preserves the exhibition’s particular framing of
          Shastra, Mandir, and Sant — Guru, including its use of Satpurush.
        </p>
        <div className="about-links">
          <Link href="/references">
            Sources & visual credits <ArrowUpRight size={15} />
          </Link>
          <a href={`${sourcePdfHref}#page=1`} target="_blank" rel="noreferrer">
            Read the exhibition source <ArrowUpRight size={15} />
          </a>
          <a
            href="https://akshardham.com/explore/mandir/"
            target="_blank"
            rel="noreferrer"
          >
            Architectural inspiration: Akshardham <ArrowUpRight size={15} />
          </a>
        </div>
        <Link className="button primary" href="/read">
          Read all six sections <ArrowRight size={16} />
        </Link>
      </dialog>
      <noscript>
        <div className="noscript-note">
          The complete exhibition is available in the{" "}
          <a href="/read">reading view</a>. Interactive camera movement requires
          JavaScript.
        </div>
      </noscript>
    </>
  );
}
