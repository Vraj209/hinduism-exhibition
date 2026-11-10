"use client";

import { useId } from "react";

type MotifKind = "aatma" | "karma" | "punarjanma" | "moksha";
const palettes: Record<MotifKind, [string, string, string]> = {
  aatma: ["#d68d28", "#f5cb7a", "#a86518"],
  karma: ["#397b9f", "#a8cbd9", "#285f7c"],
  punarjanma: ["#438d86", "#b8d8cb", "#2b716a"],
  moksha: ["#cc8444", "#f3c995", "#9c532d"],
};

/** Original visual metaphors, never portraits or depictions of religious beings. */
export function BeliefMotif({ kind }: { kind: MotifKind }) {
  const id = useId();
  const [accent, pale, deep] = palettes[kind];
  const glow = `${id}-glow`;
  const ink = `${id}-ink`;
  const petal = `${id}-petal`;
  return (
    <svg className={`manyata-motif manyata-motif-${kind}`} viewBox="0 0 240 180" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={glow}>
          <stop stopColor={pale} stopOpacity=".76" />
          <stop offset=".48" stopColor={pale} stopOpacity=".24" />
          <stop offset="1" stopColor={pale} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ink} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={pale} /><stop offset=".52" stopColor={accent} /><stop offset="1" stopColor={deep} />
        </linearGradient>
        <linearGradient id={petal} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff9e9" /><stop offset=".6" stopColor={pale} /><stop offset="1" stopColor={accent} stopOpacity=".8" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="93" rx="101" ry="83" fill={`url(#${glow})`} />
      {kind === "aatma" && <>
        <g fill="none" stroke={accent}>
          <circle cx="120" cy="86" r="57" strokeOpacity=".17" />
          <circle cx="120" cy="86" r="46" strokeOpacity=".3" strokeWidth=".7" />
          <circle cx="120" cy="86" r="30" strokeOpacity=".21" strokeWidth=".7" />
        </g>
        {Array.from({ length: 16 }, (_, index) => <path key={index} d="M120 18V25" transform={`rotate(${index * 22.5} 120 86)`} stroke={accent} strokeWidth=".8" strokeLinecap="round" opacity={index % 2 ? 0.3 : 0.55} />)}
        <circle cx="120" cy="86" r="21" fill={pale} opacity=".16" />
        <circle cx="120" cy="86" r="11" fill={pale} opacity=".4" />
        <circle cx="120" cy="86" r="5" fill="#fffaf0" />
        <circle cx="120" cy="86" r="2.2" fill="#fff" />
        <path d="M120 63V74M120 98V109M97 86H108M132 86H143" stroke="#fff9e7" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M79 157H161" stroke={accent} strokeWidth=".7" opacity=".3" />
        <circle cx="120" cy="157" r="2" fill={accent} opacity=".6" />
      </>}
      {kind === "karma" && <>
        {[{ rx: 91, ry: 33, cy: 110, opacity: .22 }, { rx: 70, ry: 25, cy: 105, opacity: .35 }, { rx: 48, ry: 17, cy: 100, opacity: .5 }, { rx: 26, ry: 9, cy: 95, opacity: .72 }].map((ring) => <ellipse key={ring.rx} cx="120" cy={ring.cy} rx={ring.rx} ry={ring.ry} fill="none" stroke={`url(#${ink})`} strokeWidth="1.3" opacity={ring.opacity} />)}
        <path d="M53 122C69 138 164 146 190 121" stroke="#fffaf0" strokeWidth="1.1" fill="none" opacity=".8" />
        <path d="M82 109C97 117 140 119 158 109" stroke="#fffaf0" strokeWidth="1.2" fill="none" opacity=".95" />
        <path d="M120 44C117 51 111 58 111 65A9 9 0 0 0 129 65C129 58 123 51 120 44Z" fill={`url(#${ink})`} />
        <path d="M117 59C115 62 115 66 117 68" stroke="#fff" opacity=".8" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <circle cx="120" cy="92" r="3" fill={deep} opacity=".65" />
        <path d="M39 153H201" stroke={accent} strokeWidth=".6" opacity=".22" />
      </>}
      {kind === "punarjanma" && <>
        <circle cx="120" cy="88" r="62" fill="none" stroke={accent} strokeWidth=".6" opacity=".18" />
        <circle cx="120" cy="88" r="49" fill="none" stroke={pale} strokeWidth="8" opacity=".5" />
        <circle cx="120" cy="88" r="49" fill="none" stroke={`url(#${ink})`} strokeWidth="1.8" />
        <circle cx="120" cy="88" r="37" fill="none" stroke={accent} strokeWidth=".7" opacity=".22" />
        <path d="M85 54A49 49 0 0 1 169 88" fill="none" stroke="#fffcf0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M166 80L169 88L175 81" fill="none" stroke={deep} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M74 96L71 88L65 95" fill="none" stroke={deep} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <g fill={deep} stroke="#faf5e8" strokeWidth="2">
          <circle cx="120" cy="39" r="4" /><circle cx="162.4" cy="112.5" r="4" /><circle cx="77.6" cy="112.5" r="4" />
        </g>
        <circle cx="120" cy="88" r="5" fill={pale} />
        <circle cx="120" cy="88" r="2" fill={accent} />
        <path d="M94 162H146" stroke={accent} strokeWidth=".7" opacity=".3" />
      </>}
      {kind === "moksha" && <>
        <ellipse cx="120" cy="147" rx="67" ry="9" fill={pale} opacity=".25" />
        <ellipse cx="120" cy="148" rx="79" ry="14" fill="none" stroke={accent} strokeWidth=".6" opacity=".22" />
        <g fill={`url(#${petal})`} stroke={accent} strokeWidth=".85" strokeLinejoin="round">
          <path d="M120 136C79 139 49 122 35 87C77 84 110 101 120 136Z" />
          <path d="M120 136C161 139 191 122 205 87C163 84 130 101 120 136Z" />
          <path d="M120 134C81 122 65 94 72 57C109 71 123 99 120 134Z" />
          <path d="M120 134C159 122 175 94 168 57C131 71 117 99 120 134Z" />
          <path d="M120 135C91 106 94 75 120 42C146 75 149 106 120 135Z" />
          <path d="M120 137C84 147 59 138 44 117C75 111 102 119 120 137Z" />
          <path d="M120 137C156 147 181 138 196 117C165 111 138 119 120 137Z" />
        </g>
        <path d="M120 57V121M82 75C87 98 98 114 114 128M158 75C153 98 142 114 126 128" fill="none" stroke="#fff8e8" strokeWidth="1" opacity=".9" />
        <ellipse cx="120" cy="124" rx="15" ry="9" fill="#fff3cd" opacity=".8" />
        <circle cx="120" cy="115" r="3" fill="#fffdf1" />
        <path d="M120 18V29M97 24L101 33M143 24L139 33" stroke={accent} strokeWidth=".9" strokeLinecap="round" opacity=".5" />
      </>}
    </svg>
  );
}

/** A light carved archivolt: ornament stays on the arch, clear of the copy. */
export function NicheCarving() {
  const id = useId();
  const stone = `${id}-stone`;
  const arch = "M12 254V184C12 111 55 72 111 49C142 36 164 24 180 10C196 24 218 36 249 49C305 72 348 111 348 184V254";
  return (
    <svg className="manyata-niche-carving" viewBox="0 0 360 260" fill="none" aria-hidden="true" focusable="false">
      <defs><linearGradient id={stone} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffdf2" /><stop offset=".4" stopColor="#d7c3a0" /><stop offset=".72" stopColor="#f8edda" /><stop offset="1" stopColor="#bda27c" /></linearGradient></defs>
      <path d={arch} stroke="#4d3019" strokeWidth="11" opacity=".09" transform="translate(0 3)" />
      <path d={arch} stroke={`url(#${stone})`} strokeWidth="12" />
      <path d={arch} stroke="#a58450" strokeWidth=".65" opacity=".7" />
      <path d="M26 254V185C26 120 64 85 117 62C145 50 166 38 180 27C194 38 215 50 243 62C296 85 334 120 334 185V254" stroke="#fffdf4" strokeWidth="1.2" opacity=".9" />
      <path d="M34 254V184C34 166 39 159 45 153C43 138 49 128 61 122C62 107 73 98 87 95C92 81 104 75 119 76C132 60 150 63 160 55C169 50 175 44 180 39C185 44 191 50 200 55C210 63 228 60 241 76C256 75 268 81 273 95C287 98 298 107 299 122C311 128 317 138 315 153C321 159 326 166 326 184V254" stroke="#b49a6c" strokeWidth="1.3" opacity=".65" />
      {[-1, 1].map((side) => <g key={side} transform={side === 1 ? "translate(360 0) scale(-1 1)" : undefined}>
        {[[25, 194, 0], [38, 151, 21], [63, 111, 37], [100, 80, 54], [139, 58, 60]].map(([x, y, rotate]) => <g key={x} transform={`translate(${x} ${y}) rotate(${rotate})`}>
          <path d="M0 10C-10 3-10-7-3-13C3-6 5 2 0 10Z" fill="#d4bf98" fillOpacity=".5" stroke="#b29462" strokeWidth=".65" />
          <path d="M1 10C9 2 11-4 9-11C1-7-2 1 1 10Z" fill="#fff9e9" fillOpacity=".75" stroke="#b29462" strokeWidth=".65" />
          <path d="M0 9V-8" stroke="#fffdf1" strokeWidth=".8" />
        </g>)}
        <path d="M7 237H32M7 242H32" stroke="#ad9167" strokeWidth=".8" opacity=".65" />
        <path d="M9 235H30" stroke="#fffdf1" strokeWidth="1.2" />
      </g>)}
      <path d="M180 6C170 18 171 26 180 32C189 26 190 18 180 6Z" fill="#efe0bd" stroke="#ac8d55" strokeWidth=".7" />
      <path d="M180 12V27" stroke="#fffef3" strokeWidth="1" />
    </svg>
  );
}
