"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, ChevronDown, Compass } from "lucide-react";
import { sections } from "@/content/exhibition";
import styles from "./section-menu.module.css";

type SectionMenuProps = {
  id: string;
  label: string;
  placeholder: string;
  heading: string;
  visited: number[];
  onSelect: (id: number) => void;
};

export function SectionMenu({ id, label, placeholder, heading, visited, onSelect }: SectionMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const listId = `${id}-options`;

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
    const width = Math.min(Math.max(rect.width, 376), viewportWidth - 24);
    const above = anchorTop - topEdge - 10;
    const below = bottomEdge - anchorBottom - 10;
    const opensAbove = above >= below;
    setPlacement({
      width,
      left: Math.max(leftEdge, Math.min(rect.left, leftEdge + viewportWidth - 24 - width)),
      top: opensAbove ? undefined : anchorBottom + 10,
      bottom: opensAbove ? window.innerHeight - anchorTop + 10 : undefined,
      maxHeight: Math.max(80, Math.min(480, opensAbove ? above : below)),
      transformOrigin: opensAbove ? "bottom left" : "top left",
    });
  }, []);

  const openMenu = (index = 0) => {
    positionPanel();
    setActiveIndex(index);
    search.current = { text: "", time: 0 };
    setOpen(true);
  };

  const choose = (index: number) => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
    onSelect(sections[index].id);
  };

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !panel.current?.contains(target)) setOpen(false);
    };
    const reposition = (event?: Event) => {
      if (event?.target instanceof Node && panel.current?.contains(event.target)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(positionPanel);
    };
    const pageScroll = (event: Event) => {
      if (event.target instanceof Node && panel.current?.contains(event.target)) return;
      setOpen(false);
    };
    const observer = new ResizeObserver(() => reposition());
    if (trigger.current) {
      observer.observe(trigger.current);
      const campus = trigger.current.closest(".campus-hero");
      if (campus) observer.observe(campus);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", pageScroll, true);
    window.visualViewport?.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("scroll", reposition);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", pageScroll, true);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("scroll", reposition);
    };
  }, [open, positionPanel]);

  useEffect(() => {
    if (!open) return;
    const option = document.getElementById(`${id}-option-${activeIndex}`);
    const list = option?.parentElement;
    if (!option || !list) return;
    const reveal = () => {
      const itemBounds = option.getBoundingClientRect();
      const listBounds = list.getBoundingClientRect();
      if (itemBounds.top < listBounds.top + 2) list.scrollTop -= Math.ceil(listBounds.top + 2 - itemBounds.top);
      else if (itemBounds.bottom > listBounds.bottom - 2) list.scrollTop += Math.ceil(itemBounds.bottom - listBounds.bottom + 2);
    };
    reveal();
    // Keep keyboard focus visible after responsive reflow and text wrapping.
    const observer = new ResizeObserver(reveal);
    observer.observe(list);
    observer.observe(option);
    return () => observer.disconnect();
  }, [open, activeIndex, id]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Tab") { setOpen(false); return; }
    if (event.key === "Escape") {
      if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      return;
    }
    if (event.ctrlKey || event.metaKey) return;
    const navigation = ["ArrowDown", "ArrowUp", "Home", "End", "PageUp", "PageDown", "Enter", " "];
    if (navigation.includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Enter" || event.key === " ") { if (open) choose(activeIndex); else openMenu(); }
      else if (event.key === "Home" || event.key === "PageUp") { if (open) setActiveIndex(0); else openMenu(); }
      else if (event.key === "End" || event.key === "PageDown") { if (open) setActiveIndex(sections.length - 1); else openMenu(sections.length - 1); }
      else if (!open) openMenu(event.key === "ArrowUp" ? sections.length - 1 : 0);
      else setActiveIndex((index) => Math.max(0, Math.min(sections.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
      return;
    }
    if (event.key.length !== 1 || event.altKey) return;
    event.preventDefault();
    const now = Date.now();
    const key = event.key.toLocaleLowerCase();
    const text = now - search.current.time > 700 ? key : search.current.text + key;
    const query = [...text].every((character) => character === key) ? key : text;
    const start = open && query.length === 1 ? activeIndex + 1 : 0;
    const index = sections.findIndex((_, offset) => {
      const item = sections[(start + offset) % sections.length];
      return [String(item.id), item.title.toLocaleLowerCase(), item.title.replace(/^Hindu\s/, "").toLocaleLowerCase(), item.theme.toLocaleLowerCase()].some((value) => value.startsWith(query));
    });
    if (!open) openMenu();
    if (index !== -1) setActiveIndex((start + index) % sections.length);
    search.current = { text, time: now };
  };

  return <>
    <button ref={trigger} id={id} type="button" role="combobox" className={`section-menu-trigger ${styles.trigger}`}
      aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
      aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
      onKeyDown={onKeyDown} onClick={() => { if (open) setOpen(false); else openMenu(); }}>
      <span className={styles.triggerText}>{placeholder}</span>
      <ChevronDown size={15} className={styles.chevron} aria-hidden="true" />
    </button>
    {open && createPortal(
      <div ref={panel} className={styles.panel} style={placement} data-section-menu="true">
        <div className={styles.header} aria-hidden="true">
          <Compass size={18} strokeWidth={1.3} /><span>{heading}</span><span className={styles.count}>06 DOMES</span>
        </div>
        <div id={listId} role="listbox" aria-label={label} className={styles.options}>
          {sections.map((section, index) => <div key={section.id} id={`${id}-option-${index}`} role="option"
            aria-selected={index === activeIndex} data-section-id={section.id} className={styles.option}
            onPointerMove={(event) => { if (event.pointerType === "mouse") setActiveIndex(index); }}
            onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
            <span className={styles.number} aria-hidden="true">{String(section.id).padStart(2, "0")}</span>
            <span className={styles.copy}><span className={styles.title}>{section.title}</span><span className={styles.theme}>{section.theme}</span></span>
            {visited.includes(section.id)
              ? <span className={styles.visited}><Check size={15} aria-hidden="true" /><span className={styles.srOnly}>Visited</span></span>
              : <ArrowUpRight size={15} className={styles.arrow} aria-hidden="true" />}
          </div>)}
        </div>
      </div>, document.body,
    )}
  </>;
}
