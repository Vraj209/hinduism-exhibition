"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import type { FestivalPhoto } from "@/content/festival-gallery-types";
import "./festival-lightbox.css";

type Props = {
  photos: FestivalPhoto[];
  initialIndex: number;
  origin: DOMRect | null;
  onClose: () => void;
  reducedMotion: boolean;
};

/** Native modal semantics keep the exhibition inert without moving its scroll position. */
export function FestivalLightbox({ photos, initialIndex, origin, onClose, reducedMotion }: Props) {
  const [index, setIndex] = useState(() => Math.max(0, Math.min(initialIndex, photos.length - 1)));
  const [closing, setClosing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosing = useRef(false);
  const opening = useRef({ origin, reducedMotion });
  const gesture = useRef<{ x: number; y: number; id: number; at: number } | null>(null);
  const photo = photos[index];

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    modal.showModal();
    closeButton.current?.focus({ preventScroll: true });
    const animationFrame = requestAnimationFrame(() => {
      const image = frame.current?.querySelector<HTMLImageElement>(".festival-lightbox-preview");
      const start = opening.current.origin;
      if (!image || !start || opening.current.reducedMotion) return;
      const end = image.getBoundingClientRect();
      if (!end.width || !end.height) return;
      frame.current?.animate([
        {
          transform: `translate(${start.x + start.width / 2 - end.x - end.width / 2}px, ${start.y + start.height / 2 - end.y - end.height / 2}px) scale(${start.width / end.width}, ${start.height / end.height})`,
          opacity: 0.65,
        },
        { transform: "none", opacity: 1 },
      ], { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
    });
    return () => {
      cancelAnimationFrame(animationFrame);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      modal.close();
    };
  }, []);

  const close = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    const finish = () => {
      // Release the modal's inert background before the parent restores focus.
      dialog.current?.close();
      onClose();
    };
    if (reducedMotion) {
      finish();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(finish, 180);
  }, [onClose, reducedMotion]);

  const move = useCallback((step: number) => {
    if (isClosing.current || photos.length < 2) return;
    setIndex((current) => (current + step + photos.length) % photos.length);
  }, [photos.length]);

  function beginSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.pointerType === "mouse") return;
    gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId, at: performance.now() };
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5 && performance.now() - start.at < 1000) {
      move(dx < 0 ? 1 : -1);
    }
  }

  if (!photo) return null;

  return (
    <dialog
      ref={dialog}
      className="festival-lightbox"
      aria-label="Festival photographs"
      aria-modal="true"
      data-closing={closing}
      data-reduced-motion={reducedMotion}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        if (event.key === "Home") { event.preventDefault(); setIndex(0); }
        if (event.key === "End") { event.preventDefault(); setIndex(photos.length - 1); }
      }}
    >
      <div className="festival-lightbox-top">
        <p className="festival-lightbox-counter" role="status" aria-live="polite" aria-atomic="true">
          <span>{String(index + 1).padStart(2, "0")}</span><span aria-hidden="true"> / </span>
          <span className="festival-lightbox-sr-only"> of </span>{String(photos.length).padStart(2, "0")}
          <span className="festival-lightbox-sr-only">. {photo.alt}</span>
        </p>
        <button ref={closeButton} type="button" className="festival-lightbox-close" aria-label="Close photographs" onClick={close}>
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>
      <div className="festival-lightbox-stage" onPointerDown={beginSwipe} onPointerUp={finishSwipe} onPointerCancel={() => { gesture.current = null; }}>
        <div className="festival-lightbox-frame" ref={frame}>
          <LightboxImage key={photo.id} photo={photo} />
        </div>
      </div>
      {photos.length > 1 && <>
        <button type="button" className="festival-lightbox-arrow festival-lightbox-previous" aria-label="Previous photograph" onClick={() => move(-1)}><ArrowLeft size={22} strokeWidth={1.5} /></button>
        <button type="button" className="festival-lightbox-arrow festival-lightbox-next" aria-label="Next photograph" onClick={() => move(1)}><ArrowRight size={22} strokeWidth={1.5} /></button>
      </>}
      <footer className="festival-lightbox-credit">
        <span>{photo.location} · {photo.year}</span>
        <a href={photo.sourcePageUrl} target="_blank" rel="noreferrer">{photo.credit}<ArrowUpRight size={12} aria-hidden="true" /></a>
      </footer>
    </dialog>
  );
}

function LightboxImage({ photo }: { photo: FestivalPhoto }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <figure className="festival-lightbox-image" aria-label={failed ? photo.alt : undefined}>
      <Image className="festival-lightbox-preview" src={photo.src} width={photo.width} height={photo.height} alt="" aria-hidden="true" unoptimized loading="eager" draggable={false} />
      {!failed && <Image className="festival-lightbox-full" data-loaded={loaded} src={photo.fullSrc} width={photo.width} height={photo.height} alt={photo.alt} unoptimized loading="eager" draggable={false} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
      {!loaded && !failed && <span className="festival-lightbox-sr-only" role="status">Loading full-size photograph</span>}
      {failed && <figcaption className="festival-lightbox-error" role="status">Full-size photograph unavailable. <a href={photo.sourcePageUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={12} /></a></figcaption>}
    </figure>
  );
}
