"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { makeFestivalCourt } from "@/lib/festival-world";
import { makeGarden } from "@/lib/world-garden";
import { worldArchitectures, type WorldMood } from "@/lib/world-architecture";
import { addInteriorCarvings } from "@/lib/interior-carving";
import {
  put,
  box,
  cyl,
  lathe,
  finish,
  column,
  arch,
  cornice,
  dome,
  lattice,
  carvedCeiling,
  floralPanel,
  storyStage,
  type Batch,
  type Palette,
  type WorldBuilt,
} from "@/lib/world-geometry";
export type WorldSceneProps = {
  sectionId: number;
  storyIndex: number;
  active: boolean;
  paused: boolean;
  reducedMotion: boolean;
  walkMode?: boolean;
  walkView?: "entrance" | "gallery" | "courtyard";
  walkAction?: { sequence: number; type: "stop" | "direct" | "resume" } | null;
  onWalkMovingChange?: (moving: boolean) => void;
  onReady: () => void;
  onSettled: () => void;
  onError: () => void;
};
type API = {
  update: (props: WorldSceneProps) => void;
};
function courtFloor(batch: Batch) {
  box(batch, "floor", 1, -0.26, -2, 34, 0.5, 36);
  box(batch, "ivory", 1, 0.02, -2, 28, 0.06, 30);
  for (let x = -12; x <= 14; x += 2)
    box(batch, "joint", x, 0.056, -2, 0.02, 0.012, 29);
  for (let z = -16; z <= 12; z += 2)
    box(batch, "joint", 1, 0.057, z, 27, 0.012, 0.02);
}
function alcove(batch: Batch, x: number, z: number, width = 5, height = 6) {
  for (const dx of [-width / 2, width / 2]) column(batch, x + dx, z, height);
  arch(batch, x, z, width - 0.15, height);
  cornice(batch, x, z, width + 1.2, 2, height + 0.15);
  box(batch, "deepStone", x, height / 2, z - 1.4, width + 1, height, 0.25);
  lattice(batch, x, z - 1.2, width - 0.7, 1.2, 0.45);
}
function framedEntrance(batch: Batch, wide = 9, height = 8) {
  for (const x of [0.5 - wide / 2, 0.5 + wide / 2])
    column(batch, x, 10, height, 0, 1.5);
  arch(batch, 0.5, 10, wide - 0.2, height);
  cornice(batch, 0.5, 10, wide + 1.8, 1.7, height + 0.15);
}
function makeEveryday(palette: Palette): WorldBuilt {
  const group = new THREE.Group(),
    batch: Batch = new Map();
  courtFloor(batch);
  for (const x of [-4, 3, 10]) {
    alcove(batch, x, -9, 5.5, 5.8);
    for (const dx of [-2.6, 2.6]) column(batch, x + dx, -9, 3.6, 6.3, 0.8);
    arch(batch, x, -9, 5.1, 3.6, 6.3);
    lattice(batch, x, -8.5, 5, 1.1, 6.3);
    cornice(batch, x, -9, 6.6, 3, 10.1);
    floralPanel(batch, x, 7.5, -10.25, 3.8, 1.8);
  }
  for (const x of [-9, 13]) {
    for (const z of [-6, -2, 2, 6]) column(batch, x, z, 5.8);
    for (const z of [-4, 0, 4]) arch(batch, x, z, 3.8, 5.8, 0, Math.PI / 2);
    cornice(batch, x, 0, 2.5, 17, 5.95);
  }
  // A timber gallery encloses a central lightwell, keeping the space domestic.
  for (const x of [-9, 13]) {
    box(batch, "rose", x, 9.7, 0, 1.4, 0.3, 18);
    for (const z of [-6, 0, 6]) column(batch, x, z, 3.6, 6.1, 0.75);
  }
  framedEntrance(batch, 10, 7.8);
  cyl(batch, "rose", 4, 0.22, 0, 2.65, 0.4, 8);
  cyl(batch, "pale", 4, 0.45, 0, 2.72, 0.1, 8);
  finish(batch, palette, group);
  const stages: THREE.Group[] = [];
  const vessel: Batch = new Map();
  lathe(
    vessel,
    "ivory",
    4,
    0.52,
    0,
    [
      [0, 0],
      [0.65, 0],
      [0.85, 0.18],
      [1.35, 0.5],
      [1.4, 0.62],
      [1.28, 0.67],
      [1.22, 0.54],
      [0.7, 0.22],
      [0, 0.2],
    ],
    40,
  );
  stages.push(storyStage(vessel, palette));
  const weave: Batch = new Map();
  for (let i = 0; i < 4; i++) {
    const g = new THREE.BoxGeometry(2.8, 0.13, 1.4);
    g.rotateZ(i % 2 ? 0.12 : -0.12);
    put(
      weave,
      i % 2 ? "fabric" : "paper",
      g,
      4,
      0.8 + i * 0.2,
      -0.1 + i * 0.12,
    );
  }
  box(weave, "rose", 6.1, 1.85, -1.1, 2.2, 2.8, 0.2);
  for (let i = -5; i <= 5; i++) {
    box(weave, "ivory", 6.1 + i * 0.18, 1.85, -0.96, 0.07, 2.5, 0.08);
    box(weave, "pale", 6.1, 1.85 + i * 0.22, -0.89, 2, 0.075, 0.08);
  }
  stages.push(storyStage(weave, palette));
  const rhythm: Batch = new Map();
  // Harmonium object study: official BAPS kirtan documentation, no invented song.
  box(rhythm, "rose", 4, 1.2, 0, 3.4, 1.1, 2);
  box(rhythm, "deepStone", 4, 1.72, 0, 3.2, 0.12, 1.8);
  for (let i = 0; i < 16; i++) {
    box(rhythm, "paper", 2.5 + i * 0.2, 1.83, 0.6, 0.185, 0.14, 0.7);
    if (i % 7 !== 2 && i % 7 !== 6)
      box(rhythm, "deepStone", 2.6 + i * 0.2, 1.97, 0.35, 0.09, 0.13, 0.42);
  }
  for (let i = 0; i < 11; i++)
    box(
      rhythm,
      i % 2 ? "rose" : "pale",
      2.25,
      1.15,
      -0.65 + i * 0.12,
      0.35,
      0.75,
      0.05,
    );
  for (let i = 0; i < 7; i++)
    cyl(rhythm, "gold", 3 + i * 0.33, 1.85, -0.6, 0.065, 0.08, 10);
  floralPanel(rhythm, 4, 1.15, 1.03, 2.3, 0.55, 0, "pale");
  stages.push(storyStage(rhythm, palette));
  return { group, flames: [], bridgeFlames: [], storyStages: stages };
}
function makeThresholds(palette: Palette): WorldBuilt {
  const group = new THREE.Group(),
    batch: Batch = new Map();
  courtFloor(batch);
  for (const z of [10, 5, 0, -5, -10]) {
    for (const x of [-3.8, 10.8]) column(batch, x, z, 8.4, 0, 1.2);
    arch(batch, 3.5, z, 14.2, 8.4);
    cornice(batch, 3.5, z, 16.5, 1.4, 8.55);
  }
  for (const x of [-7, 14]) {
    for (const z of [-10, -5, 0, 5]) column(batch, x, z, 5.2);
    for (const z of [-7.5, -2.5, 2.5])
      arch(batch, x, z, 4.8, 5.2, 0, Math.PI / 2);
    cornice(batch, x, -2.5, 2, 17, 5.4);
  }
  for (const x of [-1.1, 8.1]) box(batch, "rose", x, 0.09, -1, 0.18, 0.12, 26);
  finish(batch, palette, group);
  const stages: THREE.Group[] = [];
  const measure: Batch = new Map();
  for (let z = -9; z < 8; z += 2.2) {
    box(measure, "gold", 3.5, 0.075, z, 6, 0.015, 0.12);
  }
  stages.push(storyStage(measure, palette));
  const facing: Batch = new Map();
  for (const x of [0.6, 7.1]) {
    for (const z of [-4, -1, 2]) column(facing, x, z, 3.1, 0, 0.8);
    for (const z of [-2.5, 0.5]) arch(facing, x, z, 2.8, 3.1, 0, Math.PI / 2);
    cornice(facing, x, -1, 1.1, 7, 3.25);
  }
  stages.push(storyStage(facing, palette));
  const opening: Batch = new Map();
  for (const x of [1.2, 5.8]) column(opening, x, -11, 6.4, 0, 0.95);
  arch(opening, 3.5, -11, 4.4, 6.4);
  box(opening, "gold", 3.5, 0.1, -4, 0.14, 0.04, 21);
  stages.push(storyStage(opening, palette));
  return { group, flames: [], bridgeFlames: [], storyStages: stages };
}
function makeContemplation(palette: Palette): WorldBuilt {
  const group = new THREE.Group(),
    batch: Batch = new Map();
  courtFloor(batch);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (a > 0.2 && a < 2.8) continue;
    const x = 4 + Math.cos(a) * 10,
      z = -5 + Math.sin(a) * 10;
    column(batch, x, z, 6.3);
  }
  // Concentric carved stone courses recall the mandapam reference without copied figures.
  carvedCeiling(batch, 4, 8.5, -5, 10.5);
  cyl(batch, "ivory", 4, 8.7, -5, 10.7, 0.32, 48);
  for (const x of [-5.2, 13.2]) {
    for (const z of [-10, -5, 0]) column(batch, x, z, 5.3);
    for (const z of [-7.5, -2.5]) arch(batch, x, z, 4.7, 5.3, 0, Math.PI / 2);
  }
  for (const x of [2.35, 5.65])
    box(batch, "rose", x, 0.09, -2.5, 0.18, 0.13, 20);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    const x = 4 + Math.cos(a) * 10,
      z = -5 + Math.sin(a) * 10;
    box(batch, "rose", x, 1.1, z, 4.1, 2.2, 0.3, -a - Math.PI / 2);
    lattice(batch, x, z, 3.4, 1.2, 2.2, -a - Math.PI / 2);
  }
  finish(batch, palette, group);
  const stages: THREE.Group[] = [];
  const niche: Batch = new Map();
  alcove(niche, 4, -10.5, 3.6, 4.5);
  stages.push(storyStage(niche, palette));
  const path: Batch = new Map();
  for (const x of [2.5, 5.5])
    box(path, "gold", x, 0.14, -2.5, 0.075, 0.04, 19.8);
  for (const z of [-10, -6, -2, 2, 6])
    cyl(path, "ivory", 6.2, 0.27, z, 0.24, 0.4, 12);
  stages.push(storyStage(path, palette));
  const map: Batch = new Map();
  box(map, "rose", 7.4, 0.55, -1, 2.6, 1, 2.7);
  box(map, "pale", 7.4, 1.1, -1, 2.8, 0.12, 2.9);
  const curves = [
    [
      [6, -2],
      [6.5, -1.5],
      [7.4, -1.7],
      [8, -0.8],
      [8.7, -0.2],
    ],
    [
      [6.2, 0.1],
      [6.9, -0.5],
      [7.8, -0.3],
      [8.6, -1.5],
    ],
    [
      [6.7, -2.2],
      [7, -1.2],
      [7.6, -0.9],
      [8.4, -2],
    ],
  ];
  for (const curve of curves) {
    const pts = curve.map(
      ([x, z]) => new THREE.Vector3(7.4 + (x - 7.4) * 0.75, 1.18, z),
    );
    put(
      map,
      "gold",
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts),
        16,
        0.025,
        4,
        false,
      ),
    );
  }
  const mapStage = storyStage(map, palette);
  mapStage.position.set(-0.4, 0, -2.5);
  stages.push(mapStage);
  return {
    group,
    flames: [],
    bridgeFlames: [],
    storyStages: stages,
    pool: { x: 4, z: -2.5, width: 3.0, depth: 19.8 },
  };
}
function makePillars(palette: Palette): WorldBuilt {
  const group = new THREE.Group(),
    batch: Batch = new Map();
  courtFloor(batch);
  for (const x of [-5, 3.5, 12]) {
    alcove(batch, x, -9, 6.8, 7.2);
    dome(batch, x, 7.9, -9, 3.1, 2.5);
    carvedCeiling(batch, x, 7.5, -9, 3);
  }
  for (const x of [-9.1, 15.6]) {
    for (const z of [-6, -2, 2, 6]) column(batch, x, z, 7.2);
    for (const z of [-4, 0, 4]) arch(batch, x, z, 3.8, 7.2, 0, Math.PI / 2);
    cornice(batch, x, 0, 2.3, 17, 7.35);
  }
  framedEntrance(batch, 13, 9);
  for (const x of [-0.7, 7.7]) box(batch, "gold", x, 0.08, -2, 0.1, 0.05, 24);
  finish(batch, palette, group);
  const stages: THREE.Group[] = [];
  const book: Batch = new Map();
  cyl(book, "rose", 4, 0.45, 0, 1.8, 0.85, 8);
  cyl(book, "ivory", 4, 0.92, 0, 1.9, 0.12, 8);
  for (const side of [-1, 1]) {
    const g = new THREE.BoxGeometry(1.4, 0.23, 1.9);
    g.rotateZ(-side * 0.14);
    put(book, "pale", g, 4 + side * 0.7, 1.17, 0);
    for (let i = 0; i < 4; i++) {
      const edge = new THREE.BoxGeometry(1.4, 0.018, 1.93);
      edge.rotateZ(-side * 0.14);
      put(book, "rose", edge, 4 + side * 0.7, 1.08 + i * 0.04, 0);
    }
  }
  stages.push(storyStage(book, palette));
  const court: Batch = new Map();
  box(court, "pale", 4, 0.18, 0, 4.6, 0.3, 4);
  for (const x of [2.3, 5.7])
    for (const z of [-1.4, 1.4]) column(court, x, z, 2.9, 0.35, 0.75);
  for (const z of [-1.4, 1.4]) arch(court, 4, z, 3.2, 2.9, 0.35);
  for (const x of [2.3, 5.7]) arch(court, x, 0, 2.6, 2.9, 0.35, Math.PI / 2);
  cornice(court, 4, 0, 4.2, 3.6, 3.4);
  stages.push(storyStage(court, palette));
  const guide: Batch = new Map();
  const pts = [
    new THREE.Vector3(10, 0, -8),
    new THREE.Vector3(9, 0, -4),
    new THREE.Vector3(6, 0, -1),
    new THREE.Vector3(4, 0, 3),
    new THREE.Vector3(4, 0, 8),
  ];
  const inlay = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts),
    48,
    0.075,
    6,
    false,
  );
  inlay.scale(1, 0.12, 1);
  put(guide, "gold", inlay, 0, 0.075, 0);
  for (const x of [8.8, 11.2]) column(guide, x, -8, 3.5, 0, 0.7);
  arch(guide, 10, -8, 2.2, 3.5);
  stages.push(storyStage(guide, palette));
  return { group, flames: [], bridgeFlames: [], storyStages: stages };
}
function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const g = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,241,195,1)");
  g.addColorStop(0.15, "rgba(255,184,80,.62)");
  g.addColorStop(0.45, "rgba(255,138,36,.13)");
  g.addColorStop(1, "rgba(255,138,36,0)");
  context.fillStyle = g;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}
function cloneMood(mood: WorldMood): WorldMood {
  return { ...mood };
}
export default function WorldScene(props: WorldSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  const apiRef = useRef<API | null>(null);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const config =
      worldArchitectures[propsRef.current.sectionId] ?? worldArchitectures[4];
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      propsRef.current.onError();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.info.autoReset = false;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.sky);
    scene.fog = new THREE.Fog(config.sky, 32, 86);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(config.sky) },
        bottom: { value: new THREE.Color(config.horizon) },
      },
      vertexShader:
        "varying float altitude; void main(){altitude=normalize(position).y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "uniform vec3 top;uniform vec3 bottom;varying float altitude;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(-.06,.55,altitude)),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
    });
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(100, 24, 12),
      skyMaterial,
    );
    scene.add(sky);
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 150);
    const startCamera = new THREE.Vector3(-2.6, 5.7, 22);
    const endCamera =
      config.id === 3
        ? new THREE.Vector3(-1, 5.1, 9.5)
        : new THREE.Vector3(-2, 5.35, 18);
    const lookTarget = new THREE.Vector3(1.4, 3.15, -5);
    camera.position.copy(startCamera);
    camera.lookAt(lookTarget);
    // These authored paths share the floor level and stay clear of every story's
    // pool, display plinths, pillars, benches and raised planting. A scalar
    // distance along the same polyline keeps the return route equally safe.
    const walkX = config.id === 2 ? 3.5 : config.id === 5 ? 4 : 0.5;
    const walkY = config.id === 5 ? 1.7555 : config.id === 4 ? 1.74 : 1.75;
    const walkPath = [
      new THREE.Vector3(walkX, walkY, 12),
      new THREE.Vector3(walkX, walkY, 8),
      new THREE.Vector3(walkX, walkY, config.id === 4 ? 5.4 : 4),
    ];
    if (config.id === 4) walkPath.push(new THREE.Vector3(-1.8, walkY, 5.4));
    const walkLengths = [0];
    for (let index = 1; index < walkPath.length; index++)
      walkLengths.push(walkLengths[index - 1] + walkPath[index].distanceTo(walkPath[index - 1]));
    const walkStops = { entrance: 0, gallery: 4, courtyard: walkLengths.at(-1)! };
    let walkMode = !!propsRef.current.walkMode;
    let walkView = propsRef.current.walkView ?? "entrance";
    let walkDistance = 0, walkDestination = 0, walkSpeed = 0;
    let walkActionSequence = -1, publishedWalking = false;
    function placeWalker() {
      for (let index = 1; index < walkPath.length; index++) {
        if (walkDistance <= walkLengths[index] + 0.0001) {
          const part = (walkDistance - walkLengths[index - 1]) / (walkLengths[index] - walkLengths[index - 1]);
          camera.position.lerpVectors(walkPath[index - 1], walkPath[index], THREE.MathUtils.clamp(part, 0, 1));
          break;
        }
      }
      lookTarget.set(4, camera.position.y, -5);
      camera.lookAt(lookTarget);
    }
    function publishWalking() {
      const moving = walkMode && Math.abs(walkDestination - walkDistance) > 0.001;
      if (moving !== publishedWalking) {
        publishedWalking = moving;
        propsRef.current.onWalkMovingChange?.(moving);
      }
    }
    if (walkMode) placeWalker();
    const palette: Palette = {};
    const colors: Record<string, string> = {
      rose: config.stone,
      paper: "#f4ead5",
      fabric: "#c4a788",
      ivory: config.ivory,
      pale: config.id === 1 ? "#b17c50" : "#e3c7ac",
      gold: config.accent,
      floor: config.floor,
      joint: "#9d8162",
      deepStone: config.id === 1 ? "#3d261c" : "#91614d",
      gatewayStone: "#bd8a70",
      gatewayIvory: "#efe5d4",
      gatewayRecess: "#91614d",
      waterBase: "#293c3e",
      flame: "#ffd285",
      bridgeFlame: "#ffdc8a",
    };
    let seed = 11;
    const noise = new Uint8Array(64 * 64 * 4);
    for (let i = 0; i < noise.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const v = 160 + (seed % 90);
      noise[i] = noise[i + 1] = noise[i + 2] = v;
      noise[i + 3] = 255;
    }
    const stoneTexture = new THREE.DataTexture(noise, 64, 64);
    stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
    stoneTexture.repeat.set(5, 5);
    stoneTexture.magFilter = THREE.LinearFilter;
    stoneTexture.needsUpdate = true;
    for (const [name, color] of Object.entries(colors)) {
      const flame = name.includes("Flame") || name === "flame";
      palette[name] = new THREE.MeshStandardMaterial({
        color,
        roughness: name === "gold" ? 0.48 : 0.82,
        metalness: name === "gold" ? 0.35 : 0,
        bumpMap: flame ? null : stoneTexture,
        bumpScale: 0.045,
        emissive: flame ? "#ffaf45" : "#000000",
        emissiveIntensity: flame ? 3 : 0,
        side: config.id === 3 ? THREE.DoubleSide : THREE.FrontSide,
      });
    }
    const builders: Record<number, (palette: Palette) => WorldBuilt> = {
      1: makeEveryday,
      2: makeThresholds,
      3: makeContemplation,
      4: makeFestivalCourt,
      5: makeGarden,
      6: makePillars,
    };
    const architecture = builders[config.id](palette);
    addInteriorCarvings(architecture, palette, config.id);
    scene.add(architecture.group);
    const stages = architecture.storyStages ?? [];
    stages.forEach((stage) => scene.add(stage));
    const hemisphere = new THREE.HemisphereLight("#91a5bb", "#5c3421", 0.8);
    scene.add(hemisphere);
    const key = new THREE.DirectionalLight(
      config.lightColor ?? "#ffcf8c",
      config.lightIntensity ?? 3.2,
    );
    key.position.set(-8, 20, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -20,
      right: 20,
      top: 20,
      bottom: -20,
      near: 1,
      far: 65,
    });
    key.shadow.normalBias = 0.045;
    key.shadow.bias = -0.0001;
    scene.add(key);
    const fill = new THREE.DirectionalLight("#778eae", 0.75);
    fill.position.set(10, 10, -10);
    scene.add(fill);
    const warmLight = new THREE.PointLight("#ffab49", 62, 32, 2);
    warmLight.position.set(4, 3, -4);
    scene.add(warmLight);
    const entranceLight = new THREE.PointLight("#ffa85a", 45, 20, 2);
    entranceLight.position.set(-1, 4, 8);
    scene.add(entranceLight);
    const shaftLight = new THREE.SpotLight("#ffe7ac", 0, 28, 0.22, 0.8, 2);
    shaftLight.position.set(4, 18, -2);
    shaftLight.target.position.set(4, 0.3, -2);
    scene.add(shaftLight, shaftLight.target);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: "#ffe2a2",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 2.2, 17, 24, 1, true),
      beamMaterial,
    );
    beam.position.set(4, 8.8, -2);
    scene.add(beam);
    const pool = architecture.pool;
    const water = new Reflector(
      new THREE.PlaneGeometry(pool?.width ?? 1, pool?.depth ?? 1),
      {
        color: "#66847e",
        textureWidth: window.innerWidth < 600 ? 256 : 512,
        textureHeight: window.innerWidth < 600 ? 256 : 512,
        clipBias: 0.003,
        multisample: 0,
      },
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(
      pool?.x ?? 4,
      config.id === 3 ? 0.09 : 0.375,
      pool?.z ?? -1.5,
    );
    if (pool) scene.add(water);
    const waterMaterial = water.material as THREE.ShaderMaterial;
    waterMaterial.uniforms.uTime = { value: 0 };
    waterMaterial.uniforms.uRipple = { value: 0.001 };
    waterMaterial.fragmentShader =
      "uniform float uTime; uniform float uRipple;\n" +
      waterMaterial.fragmentShader;
    waterMaterial.fragmentShader = waterMaterial.fragmentShader.replace(
      "gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );",
      "gl_FragColor = vec4(mix(blendOverlay(base.rgb,color),vec3(.075,.115,.115),.32),1.0);",
    );
    if (config.id === 3)
      waterMaterial.fragmentShader = waterMaterial.fragmentShader.replace(
        "vec3(.075,.115,.115),.32",
        "vec3(.22,.23,.21),.55",
      );
    waterMaterial.fragmentShader = waterMaterial.fragmentShader.replace(
      "vec4 base = texture2DProj( tDiffuse, vUv );",
      "vec4 rippleUv=vUv; rippleUv.x += sin(vUv.y * 95.0 + uTime * .7) * uRipple * vUv.w; rippleUv.y += cos(vUv.x * 76.0 + uTime * .5) * uRipple * .45 * vUv.w; vec4 base = texture2DProj( tDiffuse, rippleUv );",
    );
    const glowMap = glowTexture();
    const addGlows = (positions: THREE.Vector3[]) => {
      const g = new THREE.BufferGeometry().setFromPoints(positions);
      const material = new THREE.PointsMaterial({
        map: glowMap,
        color: "#ffd5a0",
        size: 1.1,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(g, material);
      points.frustumCulled = false;
      scene.add(points);
      return { points, material };
    };
    const lamps = addGlows(architecture.flames),
      bridgeLamps = addGlows(architecture.bridgeFlames);
    let frame = 0,
      disposed = false,
      active = false,
      paused = propsRef.current.paused,
      reduced = propsRef.current.reducedMotion,
      lastRender = 0,
      ambientTime = 0,
      renderCount = 0;
    let storyTarget = Math.min(
      propsRef.current.storyIndex,
      config.moods.length - 1,
    );
    let stageWeights = Array.from(
      { length: Math.max(stages.length, config.moods.length) },
      () => 0,
    );
    stageWeights[storyTarget] = 1;
    let currentMood = cloneMood(config.moods[storyTarget]);
    let transition: null | {
      start: number;
      duration: number;
      from: WorldMood;
      to: WorldMood;
      cameraFrom: THREE.Vector3;
      cameraTo: THREE.Vector3;
      stageFrom: number[];
      stageTo: number[];
    } = null;
    function applyMood() {
      renderer.shadowMap.needsUpdate = true;
      stages.forEach((stage, index) => {
        const opacity = stageWeights[index] ?? 0;
        stage.visible = opacity > 0.001;
        stage.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const material = object.material as THREE.MeshStandardMaterial;
            object.castShadow = opacity > 0.999;
            material.opacity = opacity;
            material.transparent = opacity < 0.999;
            material.depthWrite = opacity > 0.999;
          }
        });
      });
      palette.flame.emissiveIntensity = 2.7 * currentMood.lampStrength;
      palette.bridgeFlame.emissiveIntensity = 3.6 * currentMood.bridgeStrength;
      lamps.material.opacity = 0.75 * currentMood.lampStrength;
      bridgeLamps.material.opacity = 0.9 * currentMood.bridgeStrength;
      warmLight.intensity = 30 + currentMood.lampStrength * 38;
      hemisphere.intensity = currentMood.ambient;
      if (config.id === 4) {
        const day = THREE.MathUtils.clamp(
          (currentMood.ambient - 0.75) / 0.85,
          0,
          1,
        );
        skyMaterial.uniforms.top.value
          .set("#172934")
          .lerp(new THREE.Color("#a2b8bd"), day);
        skyMaterial.uniforms.bottom.value
          .set("#664938")
          .lerp(new THREE.Color("#eddbb7"), day);
        (scene.fog as THREE.Fog).color.copy(skyMaterial.uniforms.bottom.value);
        key.intensity = 2.1 + day * 1.1;
      }
      shaftLight.intensity = 420 * currentMood.shaftStrength;
      beamMaterial.opacity = 0.055 * currentMood.shaftStrength;
      waterMaterial.uniforms.uRipple.value =
        reduced || config.id !== 4
          ? 0
          : (1 - currentMood.waterStillness) * 0.0015;
    }
    function render() {
      if (disposed) return;
      renderer.info.reset();
      renderer.render(scene, camera);
      renderCount++;
      renderer.domElement.dataset.renderCount = String(renderCount);
      renderer.domElement.dataset.drawCalls = String(
        renderer.info.render.calls,
      );
      renderer.domElement.dataset.renderTriangles = String(
        renderer.info.render.triangles,
      );
      renderer.domElement.dataset.storyIndex = String(
        propsRef.current.storyIndex,
      );
      renderer.domElement.dataset.stageWeights = stageWeights
        .map((w) => w.toFixed(2))
        .join(",");
      renderer.domElement.dataset.motion =
        paused || reduced || !active ? "still" : "ambient";
      renderer.domElement.dataset.cameraPosition = camera.position.toArray().map(value => value.toFixed(4)).join(",");
      renderer.domElement.dataset.cameraTarget = lookTarget.toArray().map(value => value.toFixed(4)).join(",");
      renderer.domElement.dataset.walkMode = String(walkMode);
      renderer.domElement.dataset.walkView = walkView;
      renderer.domElement.dataset.walkMoving = String(publishedWalking);
      renderer.domElement.dataset.walkDistance = walkDistance.toFixed(4);
      renderer.domElement.dataset.walkRoute = JSON.stringify(walkPath.map(point => point.toArray()));
      if (walkMode) renderer.domElement.dataset.eyeHeightMeters = "1.700";
    }
    function request() {
      if (!disposed && !frame && !document.hidden)
        frame = requestAnimationFrame(tick);
    }
    function tick(now: number) {
      frame = 0;
      if (disposed || document.hidden) return;
      const elapsed = lastRender ? Math.min(0.1, (now - lastRender) / 1000) : 0;
      if (
        now - lastRender < 1000 / (config.id === 4 ? 24 : 12) &&
        transition === null &&
        !publishedWalking
      ) {
        request();
        return;
      }
      lastRender = now;
      if (transition) {
        const t =
          transition.duration === 0
            ? 1
            : Math.min(1, (now - transition.start) / transition.duration);
        const ease = 1 - Math.pow(1 - t, 3);
        for (const key of Object.keys(currentMood) as (keyof WorldMood)[])
          currentMood[key] = THREE.MathUtils.lerp(
            transition.from[key],
            transition.to[key],
            ease,
          );
        stageWeights = transition.stageFrom.map((weight, index) =>
          THREE.MathUtils.lerp(weight, transition!.stageTo[index], ease),
        );
        if (!walkMode) {
          camera.position.lerpVectors(transition.cameraFrom, transition.cameraTo, ease);
          camera.lookAt(lookTarget);
        }
        applyMood();
        if (t === 1) {
          transition = null;
          propsRef.current.onSettled();
        }
      }
      if (active && walkMode && !paused && publishedWalking) {
        const remaining = Math.abs(walkDestination - walkDistance);
        const desiredSpeed = Math.min(1.3, Math.sqrt(2 * 1.8 * remaining));
        walkSpeed = THREE.MathUtils.damp(walkSpeed, desiredSpeed, 5, elapsed);
        const step = Math.min(remaining, walkSpeed * elapsed);
        walkDistance += Math.sign(walkDestination - walkDistance) * step;
        if (remaining - step < 0.006) {
          walkDistance = walkDestination;
          walkSpeed = 0;
        }
        placeWalker();
        publishWalking();
      }
      if (active && !paused && !reduced) {
        ambientTime += elapsed;
        key.intensity =
          (config.lightIntensity ?? 3.2) *
          (1 + Math.sin(ambientTime * 0.16) * 0.014);
        hemisphere.intensity =
          currentMood.ambient * (1 + Math.sin(ambientTime * 0.12) * 0.01);
        const shimmer =
          1 +
          Math.sin(ambientTime * 1.7) * 0.025 +
          Math.sin(ambientTime * 2.9) * 0.012;
        palette.flame.emissiveIntensity =
          2.7 * currentMood.lampStrength * shimmer;
        lamps.material.opacity = 0.75 * currentMood.lampStrength * shimmer;
        waterMaterial.uniforms.uTime.value = ambientTime;
      }
      render();
      if (transition || (active && !paused && (!reduced || publishedWalking))) request();
    }
    function update(next: WorldSceneProps) {
      paused = next.paused;
      reduced = next.reducedMotion;
      const wasActive = active;
      active = next.active;
      const wasWalking = walkMode;
      walkMode = !!next.walkMode;
      const nextView = next.walkView ?? "entrance";
      if (walkMode && (!wasWalking || !wasActive)) {
        walkDistance = 0;
        walkSpeed = 0;
        placeWalker();
      }
      if (walkMode && (walkView !== nextView || !wasWalking || !wasActive))
        walkDestination = walkStops[nextView];
      walkView = nextView;
      if (walkMode && next.walkAction && next.walkAction.sequence !== walkActionSequence) {
        walkActionSequence = next.walkAction.sequence;
        if (next.walkAction.type === "stop") walkDestination = walkDistance;
        else if (next.walkAction.type === "resume") walkDestination = walkStops[walkView];
        else walkDistance = walkDestination;
        walkSpeed = 0;
      }
      if (walkMode && reduced) walkDistance = walkDestination;
      if (walkMode) placeWalker();
      publishWalking();
      const mood =
        config.moods[Math.min(next.storyIndex, config.moods.length - 1)] ??
        config.moods[0];
      const changed =
        storyTarget !== next.storyIndex ||
        JSON.stringify(mood) !== JSON.stringify(transition?.to ?? currentMood);
      storyTarget = next.storyIndex;
      if (active && (!wasActive || changed)) {
        transition = {
          start: performance.now(),
          duration: reduced || paused ? 0 : !wasActive ? 650 : 500,
          from: cloneMood(currentMood),
          to: cloneMood(mood),
          cameraFrom: camera.position.clone(),
          cameraTo: endCamera.clone(),
          stageFrom: [...stageWeights],
          stageTo: stageWeights.map((_, index) =>
            index === next.storyIndex ? 1 : 0,
          ),
        };
      }
      if (!active) {
        transition = null;
        if (!walkMode) {
          camera.position.copy(startCamera);
          camera.lookAt(lookTarget);
        }
      }
      if (paused || reduced) {
        cancelAnimationFrame(frame);
        frame = 0;
        if (transition) {
          currentMood = cloneMood(transition.to);
          stageWeights = [...transition.stageTo];
          if (!walkMode) {
            camera.position.copy(transition.cameraTo);
            camera.lookAt(lookTarget);
          }
          transition = null;
          propsRef.current.onSettled();
        }
        applyMood();
        lastRender = 0;
        render();
      } else request();
    }
    function resize() {
      const width = host!.clientWidth || 1440,
        height = host!.clientHeight || 900;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 600 ? 61 : walkMode ? 56 : 44;
      if (walkMode) lookTarget.set(4, camera.position.y, -5);
      else lookTarget.set(width < 600 ? 3.6 : 1.4, width < 600 ? 2 : 3.15, -5);
      camera.lookAt(lookTarget);
      camera.updateProjectionMatrix();
      render();
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        lastRender = 0;
        request();
      }
    }
    function lost(event: Event) {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      propsRef.current.onError();
    }
    let triangles = 0;
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh)
        triangles +=
          (o.geometry.index?.count ??
            o.geometry.getAttribute("position").count) / 3;
    });
    renderer.domElement.dataset.geometryTriangles = String(triangles);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    document.addEventListener("visibilitychange", visibility);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    apiRef.current = { update };
    applyMood();
    resize();
    propsRef.current.onReady();
    update(propsRef.current);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      apiRef.current = null;
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points)
          o.geometry.dispose();
      });
      const materials = new Set<THREE.Material>(Object.values(palette));
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && !(object instanceof Reflector)) {
          if (Array.isArray(object.material))
            object.material.forEach((m) => materials.add(m));
          else materials.add(object.material);
        }
      });
      materials.forEach((m) => m.dispose());
      beamMaterial.dispose();
      skyMaterial.dispose();
      lamps.material.dispose();
      bridgeLamps.material.dispose();
      glowMap.dispose();
      stoneTexture.dispose();
      water.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [props.sectionId]);
  useEffect(() => {
    apiRef.current?.update(props);
  }, [props]);
  return (
    <div
      className="world-webgl"
      ref={hostRef}
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
