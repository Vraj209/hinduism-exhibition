"use client";

import Image from "next/image";
import { Check, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { INDIA_MAP_VIEWBOX, INDIA_MAP_SOURCE, indiaMapRegions } from "@/content/india-map";
import { culturalStates, attireVariationNote, languageSourceNote, attireImageNote } from "@/content/jivan-shaili";
import { territoryAttire, territoryGeneratedNote } from "@/content/territory-attire";
import { RegionMenu } from "./region-menu";

export function CultureExplorer({ reducedMotion }: { reducedMotion: boolean }) {
  const [selectedId, setSelectedId] = useState("IN-GJ");
  const [query, setQuery] = useState("");
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const regions = [...indiaMapRegions].sort((a, b) => a.name.localeCompare(b.name));
  const selectedRegion = regions.find((region) => region.id === selectedId)!;
  const state = culturalStates.find((entry) => entry.id === selectedId);
  const territory = territoryAttire.find((entry) => entry.id === selectedId);
  const attire = state?.attire ?? territory?.attire;
  const languages = state?.languages ?? territory?.languages ?? [];
  const inspected = regions.find((region) => region.id === inspectedId) ?? selectedRegion;
  const matches = regions.filter((region) => `${region.name} ${culturalStates.find((entry) => entry.id === region.id)?.nameGujarati ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  useEffect(() => {
    if (reducedMotion) return;
    const animation = panel.current?.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    return () => animation?.cancel();
  }, [selectedId, reducedMotion]);

  function select(id: string) { setSelectedId(id); }

  return <section className="culture-explorer jivan-reveal" data-jivan-section="culture" aria-labelledby="culture-title">
    <header className="culture-heading">
      <div><p className="jivan-kicker">01 & 02 / Language & traditional attire</p><h2 id="culture-title" tabIndex={-1}>Bhasha <em>&</em> Bhusha</h2></div>
      <p>Explore the states of India.<br />Discover the voices and dress of a living culture.</p>
    </header>
    <div className="culture-layout">
      <div className="culture-map-column">
        <div className="culture-selector">
          <label htmlFor="culture-search">Find a state or union territory</label>
          <div className="culture-search-field"><Search size={17} aria-hidden="true" /><input id="culture-search" type="search" placeholder="Search India…" value={query} onChange={(event) => setQuery(event.target.value)} aria-controls="culture-state-select" /></div>
          <RegionMenu id="culture-state-select" regions={matches} value={selectedId} onSelect={select} />
          <p className="culture-search-status" role="status">{query ? matches.length ? `${matches.length} matching places. Choose one from the selector.` : "No matches. Try another name or clear your search." : "Choose on the map or use the selector."}</p>
        </div>

        <div className="india-map-frame">
          <div className="india-map-heading"><span>INDIA <i>/</i> <span lang="gu">ભારત</span></span><span className="india-map-name">{inspected.name}{inspected.id === selectedId && <Check size={13} aria-label="Selected" />}</span></div>
          <svg className="india-map" viewBox={INDIA_MAP_VIEWBOX} role="group" aria-labelledby="india-map-title india-map-description">
            <title id="india-map-title">Explore India by state or union territory</title>
            <desc id="india-map-description">Select a region to explore its language and traditional attire. Use arrow keys to move through places, then Enter or Space to select. All places are also available in the selector above.</desc>
            <defs><linearGradient id="india-sandstone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ddc5a1" /><stop offset="1" stopColor="#b89a75" /></linearGradient><pattern id="india-ut" patternUnits="userSpaceOnUse" width="5" height="5"><rect width="5" height="5" fill="#9c8c79" /><path d="M0 5L5 0" stroke="#c1af96" strokeWidth="0.6" /></pattern></defs>
            {regions.map((region, index) => <path key={region.id} d={region.path} data-region={region.id} data-kind={region.kind} role="button"
              aria-label={`${region.name}${region.kind === "union-territory" ? ", union territory" : ""}`} aria-pressed={region.id === selectedId} aria-controls="culture-panel"
              tabIndex={region.id === selectedId ? 0 : -1} className={`india-region ${region.id === selectedId ? "is-selected" : ""}`} vectorEffect="non-scaling-stroke" fillRule="evenodd"
              onPointerEnter={() => setInspectedId(region.id)} onPointerLeave={() => setInspectedId(null)} onFocus={() => setInspectedId(region.id)} onBlur={() => setInspectedId(null)} onClick={() => select(region.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(region.id); }
                const direction = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
                if (direction || event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  const next = event.key === "Home" ? 0 : event.key === "End" ? regions.length - 1 : (index + (direction ?? 0) + regions.length) % regions.length;
                  event.currentTarget.parentElement?.querySelector<SVGPathElement>(`[data-region="${regions[next].id}"]`)?.focus();
                }
              }}><title>{region.name}</title></path>)}
          </svg>
          <div className="india-map-legend" aria-label="Map legend"><span><i />State</span><span><i />Selected</span><span><i />Union territory</span></div>
        </div>
        <p className="culture-map-note">28 states · 8 union territories. The attire collection includes the poster’s 28 state entries and additional examples for Jammu and Kashmir and Ladakh.<br />Map: <a href={INDIA_MAP_SOURCE.url} target="_blank" rel="noreferrer">DataMeet / geoBoundaries</a> · <a href={INDIA_MAP_SOURCE.licenseUrl} target="_blank" rel="noreferrer">CC BY 2.5 IN</a> · Boundaries follow the source.</p>
      </div>

      <div ref={panel} id="culture-panel" className="culture-panel" data-state={selectedId} role="region" aria-labelledby="culture-state-title">
        <header className="culture-state-header"><p className="jivan-kicker">{state ? `From the Bhusha collection / ${String(state.posterNumber).padStart(2, "0")}` : "Union territory"}</p><h3 id="culture-state-title">{selectedRegion.name}</h3>{state && <p lang="gu" className="culture-gujarati">{state.nameGujarati}</p>}</header>
        {attire ? <>
          {languages.length > 0 && <section className="culture-language" aria-labelledby="bhasha-label"><h4 id="bhasha-label">Bhasha <span>Language</span></h4>
            <p className="culture-language-note">Main regional languages and varieties</p>
            <ul role="list">{languages.map((language) => <li key={language.name}>{language.name}{language.nativeName && <span>{language.nativeName}</span>}</li>)}</ul>
            <p className="culture-language-note">{languageSourceNote}</p>
          </section>}
          <section className="culture-attire" aria-labelledby="bhusha-label"><h4 id="bhusha-label">Bhusha <span>Traditional attire</span></h4>
            {attire.community && <p className="culture-community">{attire.community}{attire.communityGujarati && <span lang="gu"> · {attire.communityGujarati}</span>}</p>}
            <div className="culture-attire-image">
              {attire.image ? <Image src={attire.image.src} alt={attire.image.alt} width={attire.image.width} height={attire.image.height} sizes="(max-width: 760px) 88vw, 38vw" /> : <div className="culture-image-pending"><div className="culture-textile-mark" aria-hidden="true"><span /><span /><span /></div><p>Traditional attire</p><span>{attireImageNote}</span></div>}
            </div>
            {attire.image?.kind === "generated-illustration" && <p className="culture-generated-note">{territory ? territoryGeneratedNote : "Generated illustration based on the supplied Bhusha poster; not an original photograph."}</p>}
            <dl className="culture-garments"><div><dt>Men <span lang="gu">પુરુષ</span></dt><dd>{attire.men}{attire.menGujarati && <span lang="gu">{attire.menGujarati}</span>}</dd></div><div><dt>Women <span lang="gu">સ્ત્રી</span></dt><dd>{attire.women}{attire.womenGujarati && <span lang="gu">{attire.womenGujarati}</span>}</dd></div></dl>
            <p className="culture-variation">{territory?.variationNote ?? attireVariationNote}</p>
            {state && (!attire.menGujarati || !attire.womenGujarati) && <p className="culture-translation-note">Gujarati garment labels await a legible source.</p>}
          </section>
        </> : <div className="culture-territory-note"><span className="jivan-rule" /><p>This union territory is shown on the map. Language and attire details are not included in the supplied 28-state poster.</p><p>Verified exhibition content is awaited.</p></div>}
      </div>
    </div>
    <span className="gallery-sr-only" role="status">{selectedRegion.name} selected. {state || territory ? "Language and traditional attire panel updated." : "Verified exhibition content is not yet available."}</span>
  </section>;
}
