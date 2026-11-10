"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, MapPin } from "lucide-react";
import type { IndiaMapRegion } from "@/content/india-map";
import styles from "./region-menu.module.css";

type Props = {
  id: string;
  regions: IndiaMapRegion[];
  value: string;
  onSelect: (id: string) => void;
};

const label = "Select a state or union territory";
const groups = [{ kind: "state", label: "States" }, { kind: "union-territory", label: "Union territories" }] as const;

export function RegionMenu({ id, regions, value, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(value);
  const [placement, setPlacement] = useState<CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const options = groups.flatMap(({ kind }) => regions.filter((region) => region.kind === kind));
  const selected = options.find((region) => region.id === value);
  const activeIndex = Math.max(0, options.findIndex((region) => region.id === activeId));
  const active = options[activeIndex];
  const expanded = open && options.length > 0;
  const optionId = (regionId: string) => `${id}-option-${regionId}`;

  const positionPanel = useCallback(() => {
    if (!trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const viewport = window.visualViewport;
    const leftEdge = (viewport?.offsetLeft ?? 0) + 12;
    const topEdge = (viewport?.offsetTop ?? 0) + 12;
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const bottomEdge = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 12;
    const anchorTop = Math.max(topEdge, Math.min(rect.top, bottomEdge));
    const anchorBottom = Math.max(topEdge, Math.min(rect.bottom, bottomEdge));
    const width = Math.min(Math.max(rect.width, 360), viewportWidth - 24);
    const above = anchorTop - topEdge - 8;
    const below = bottomEdge - anchorBottom - 8;
    const opensAbove = below < 280 && above > below;
    setPlacement({
      width,
      left: Math.max(leftEdge, Math.min(rect.left, leftEdge + viewportWidth - 24 - width)),
      top: opensAbove ? undefined : anchorBottom + 8,
      bottom: opensAbove ? window.innerHeight - anchorTop + 8 : undefined,
      maxHeight: Math.max(0, Math.min(448, opensAbove ? above : below)),
      transformOrigin: opensAbove ? "bottom left" : "top left",
    });
  }, []);

  function openMenu(index = Math.max(0, options.findIndex((region) => region.id === value))) {
    if (!options.length) return;
    positionPanel();
    setActiveId(options[index].id);
    search.current = { text: "", time: 0 };
    trigger.current?.focus({ preventScroll: true });
    setOpen(true);
  }

  function choose(regionId: string) {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
    onSelect(regionId);
  }

  useEffect(() => {
    if (!expanded) return;
    // Ignore scroll events queued before the trigger opened the menu (for example,
    // when bringing an offscreen control into view). Later page scrolling dismisses it.
    const scrollPositions = new Map<Element, { top: number; left: number }>();
    for (let node = trigger.current?.parentElement; node; node = node.parentElement) {
      scrollPositions.set(node, { top: node.scrollTop, left: node.scrollLeft });
    }
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !panel.current?.contains(target)) setOpen(false);
    };
    const pageScroll = (event: Event) => {
      if (event.target instanceof Node && panel.current?.contains(event.target)) return;
      const target = event.target === document ? document.scrollingElement : event.target;
      if (target instanceof Element) {
        const initial = scrollPositions.get(target);
        if (initial && target.scrollTop === initial.top && target.scrollLeft === initial.left) return;
      }
      setOpen(false);
    };
    const close = () => setOpen(false);
    const observer = new ResizeObserver(positionPanel);
    if (trigger.current) observer.observe(trigger.current);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener("scroll", pageScroll, true);
    window.addEventListener("resize", positionPanel);
    window.addEventListener("hashchange", close);
    window.visualViewport?.addEventListener("resize", positionPanel);
    window.visualViewport?.addEventListener("scroll", positionPanel);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      window.removeEventListener("scroll", pageScroll, true);
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("hashchange", close);
      window.visualViewport?.removeEventListener("resize", positionPanel);
      window.visualViewport?.removeEventListener("scroll", positionPanel);
    };
  }, [expanded, positionPanel]);

  useEffect(() => {
    if (!expanded || !active) return;
    const option = document.getElementById(`${id}-option-${active.id}`);
    const viewport = list.current;
    if (!option || !viewport) return;
    const reveal = () => {
      const itemBounds = option.getBoundingClientRect();
      const listBounds = viewport.getBoundingClientRect();
      if (itemBounds.top < listBounds.top + 2) viewport.scrollTop -= Math.ceil(listBounds.top + 2 - itemBounds.top);
      else if (itemBounds.bottom > listBounds.bottom - 2) viewport.scrollTop += Math.ceil(itemBounds.bottom - listBounds.bottom + 2);
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(viewport);
    observer.observe(option);
    return () => observer.disconnect();
  }, [expanded, active, id]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Tab") { setOpen(false); return; }
    if (event.key === "Escape") {
      if (expanded) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (["ArrowDown", "ArrowUp", "Home", "End", "PageUp", "PageDown", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Enter" || event.key === " ") { if (expanded) choose(active.id); else openMenu(); }
      else {
        const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
          : Math.max(0, Math.min(options.length - 1, activeIndex + ({ ArrowDown: 1, ArrowUp: -1, PageDown: 7, PageUp: -7 }[event.key] ?? 0)));
        if (expanded) setActiveId(options[next].id);
        else openMenu(event.key === "Home" || event.key === "End" ? next : undefined);
      }
      return;
    }
    if (event.key.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    const now = Date.now();
    const key = event.key.toLocaleLowerCase();
    const text = now - search.current.time > 700 ? key : search.current.text + key;
    const query = [...text].every((character) => character === key) ? key : text;
    const start = query.length === 1 ? activeIndex + 1 : 0;
    const offset = options.findIndex((_, index) => options[(start + index) % options.length].name.toLocaleLowerCase().startsWith(query));
    if (!expanded) openMenu();
    if (offset !== -1) setActiveId(options[(start + offset) % options.length].id);
    search.current = { text, time: now };
  }

  return <>
    <button ref={trigger} id={id} type="button" role="combobox" className="culture-select-field culture-select-trigger"
      aria-label={label} aria-haspopup="listbox" aria-expanded={expanded} aria-controls={expanded ? `${id}-options` : undefined}
      aria-activedescendant={expanded ? optionId(active.id) : undefined} disabled={!options.length}
      onKeyDown={onKeyDown} onClick={() => { if (expanded) setOpen(false); else openMenu(); }}>
      <span>{selected?.name ?? (options.length ? `Choose from ${options.length} places` : "No matching places")}</span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    {expanded && createPortal(<div ref={panel} className={styles.panel} style={placement} data-region-menu="true">
      <div className={styles.header} aria-hidden="true"><MapPin size={16} strokeWidth={1.5} /><span>Explore India</span><span className={styles.count}>{options.length} PLACES</span></div>
      <div ref={list} id={`${id}-options`} role="listbox" aria-label={label} className={styles.options}>
        {groups.map(({ kind, label: groupLabel }) => {
          const entries = options.filter((region) => region.kind === kind);
          return entries.length > 0 && <div key={kind} role="group" aria-labelledby={`${id}-${kind}-label`}>
            <div id={`${id}-${kind}-label`} className={styles.groupLabel}>{groupLabel}<span aria-hidden="true">{String(entries.length).padStart(2, "0")}</span></div>
            {entries.map((region) => <div key={region.id} id={optionId(region.id)} role="option" aria-selected={region.id === value}
              data-active={region.id === active.id} className={styles.option}
              onPointerMove={(event) => { if (event.pointerType === "mouse") setActiveId(region.id); }}
              onMouseDown={(event) => event.preventDefault()} onClick={() => choose(region.id)}>
              <span>{region.name}</span>{region.id === value && <Check size={16} aria-hidden="true" />}
            </div>)}
          </div>;
        })}
      </div>
    </div>, document.body)}
  </>;
}
