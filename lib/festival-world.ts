import * as THREE from "three";
import { festivals } from "@/content/festivals";
import {
  box,
  cyl,
  lathe,
  put,
  torus,
  column,
  arch,
  cornice,
  dome,
  lattice,
  finish,
  storyStage,
  type Batch,
  type Palette,
  type WorldBuilt,
} from "./world-geometry";

// Original exhibit tableaux. Official photographs are references, never textures.
// Objects describe a celebration; they do not simulate a ritual or a sacred murti.
function sphere(
  batch: Batch,
  material: string,
  x: number,
  y: number,
  z: number,
  radius: number,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const geometry = new THREE.SphereGeometry(radius, 12, 8);
  geometry.scale(sx, sy, sz);
  put(batch, material, geometry, x, y, z);
}
function bowl(
  batch: Batch,
  x: number,
  y: number,
  z: number,
  radius = 0.55,
  material = "brass",
) {
  lathe(
    batch,
    material,
    x,
    y,
    z,
    [
      [0, 0],
      [radius * 0.45, 0],
      [radius * 0.9, radius * 0.25],
      [radius, radius * 0.4],
      [radius * 0.91, radius * 0.45],
      [radius * 0.8, radius * 0.25],
      [0, 0.06],
    ],
    20,
  );
}
function diya(batch: Batch, x: number, y: number, z: number, scale = 1) {
  bowl(batch, x, y, z, 0.26 * scale, "terracotta");
  sphere(batch, "flame", x, y + 0.23 * scale, z, 0.065 * scale, 0.7, 2.3, 0.7);
}
function garland(
  batch: Batch,
  x: number,
  y: number,
  z: number,
  width: number,
  material = "marigold",
) {
  for (let i = 0; i <= 25; i++) {
    const t = i / 25;
    sphere(
      batch,
      i % 4 === 0 ? "creamFlower" : material,
      x + (t - 0.5) * width,
      y - Math.sin(t * Math.PI) * 0.75,
      z,
      0.12,
      1,
      0.9,
      0.85,
    );
  }
}
function flowers(
  batch: Batch,
  x: number,
  y: number,
  z: number,
  radius: number,
) {
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    sphere(
      batch,
      i % 2 ? "marigold" : "creamFlower",
      x + Math.cos(a) * radius,
      y,
      z + Math.sin(a) * radius,
      0.13,
      1,
      0.6,
      1,
    );
  }
}
function canopy(batch: Batch, color = "saffron") {
  for (const x of [1.8, 6.2])
    for (const z of [-3.5, -0.5]) column(batch, x, z, 4.7, 0.5, 0.65);
  box(batch, color, 4, 5.25, -2, 5, 0.15, 3.8);
  cornice(batch, 4, -2, 5.1, 3.9, 5.4);
  garland(batch, 4, 4.7, -0.35, 4.4);
  garland(batch, 4, 4.7, -3.65, 4.4);
}
function cradle(batch: Batch, color = "saffron") {
  canopy(batch, color);
  for (const x of [3, 5]) {
    cyl(batch, "brass", x, 2.75, -2, 0.028, 4, 8);
    box(batch, "wood", x, 1.2, -2, 0.15, 0.5, 1.3);
  }
  box(batch, "wood", 4, 1, -2, 2.4, 0.18, 1.5);
  box(batch, color, 4, 1.17, -2, 2.05, 0.15, 1.25);
  for (const z of [-2.7, -1.3])
    for (let x = 2.9; x <= 5.2; x += 0.3)
      cyl(batch, "wood", x, 1.4, z, 0.055, 0.7, 8);
  flowers(batch, 4, 0.56, -2, 2.5);
}
function displayTable(batch: Batch, color = "saffron") {
  box(batch, "wood", 4, 0.95, -1, 6, 0.28, 3.7);
  box(batch, color, 4, 1.11, -1, 6.1, 0.07, 3.8);
  for (const x of [1.3, 6.7])
    for (const z of [-2.5, 0.5])
      box(batch, "wood", x, 0.55, z, 0.22, 0.8, 0.22);
}
function bookStand(batch: Batch) {
  const left = new THREE.BoxGeometry(1.5, 0.1, 2.4);
  left.rotateZ(-0.35);
  put(batch, "wood", left, 3.4, 1.35, -1);
  const right = new THREE.BoxGeometry(1.5, 0.1, 2.4);
  right.rotateZ(0.35);
  put(batch, "wood", right, 4.6, 1.35, -1);
  for (const x of [3.45, 4.55]) {
    const page = new THREE.BoxGeometry(1.05, 0.16, 1.9);
    page.rotateZ(x < 4 ? -0.16 : 0.16);
    put(batch, "paper", page, x, 1.65, -1);
  }
}

function templeSpire(
  batch: Batch,
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
) {
  const radiusAt = (t: number) =>
    radius *
    (0.11 + 0.89 * Math.pow(Math.max(0, Math.cos((t * Math.PI) / 2)), 0.72));
  const profile: [number, number][] = Array.from({ length: 21 }, (_, i) => [
    radiusAt(i / 20),
    (i / 20) * height,
  ]);
  lathe(batch, "rose", x, y, z, profile, 24);
  for (let tier = 0; tier < 10; tier++) {
    const t = tier / 10;
    cyl(batch, "rose", x, y + t * height, z, radiusAt(t) + 0.05, 0.07, 24);
    for (let rib = 0; rib < 12; rib++) {
      const a = (rib / 12) * Math.PI * 2,
        r = radiusAt(t + 0.035);
      box(
        batch,
        rib % 3 ? "rose" : "ivory",
        x + Math.cos(a) * r,
        y + (t + 0.035) * height,
        z + Math.sin(a) * r,
        0.2 * (1 - t * 0.6),
        height / 12,
        0.15,
        -a,
      );
    }
  }
  cyl(batch, "ivory", x, y + height, z, radius * 0.25, 0.2, 20);
  lathe(
    batch,
    "brass",
    x,
    y + height + 0.2,
    z,
    [
      [0.14, 0],
      [0.18, 0.15],
      [0.08, 0.3],
      [0, 0.6],
    ],
    12,
  );
}

function tableau(id: string, palette: Palette) {
  const b: Batch = new Map();
  switch (id) {
    case "diwali":
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 9; col++)
          diya(b, 1 + col * 0.75, 0.53, -3 + row * 1.15, 1.25);
      for (const x of [-0.4, 8.4]) {
        cyl(b, "brass", x, 1.3, -1, 0.2, 1.6, 12);
        bowl(b, x, 2.12, -1, 0.6);
        for (let i = 0; i < 5; i++)
          diya(
            b,
            x + Math.cos((i / 5) * Math.PI * 2) * 0.45,
            2.27,
            -1 + Math.sin((i / 5) * Math.PI * 2) * 0.45,
            0.85,
          );
      }
      flowers(b, 4, 0.53, -1, 3.3);
      break;
    case "annakut":
      for (let tier = 0; tier < 4; tier++) {
        const z = -3.2 + tier * 1.05,
          y = 0.75 + (3 - tier) * 0.48;
        box(b, "ivory", 4, y - 0.16, z, 6.9, 0.32, 1.1);
        for (let j = 0; j < 8; j++) {
          const x = 0.95 + j * 0.86;
          bowl(b, x, y + 0.04, z, 0.37);
          if ((j + tier) % 3 === 0) {
            sphere(b, "rice", x, y + 0.25, z, 0.31, 1, 0.65, 1);
          } else
            for (let k = 0; k < 5; k++)
              sphere(
                b,
                ["sweet", "greenFood", "fruit"][(j + tier) % 3],
                x + Math.cos(k * 2.4) * 0.18,
                y + 0.27 + (k % 2) * 0.1,
                z + Math.sin(k * 2.4) * 0.16,
                0.12,
              );
        }
      }
      garland(b, 4, 5.5, -6, 8);
      break;
    case "holi":
      flowers(b, 4, 0.53, -1, 2.8);
      for (let layer = 0; layer < 4; layer++)
        for (let i = 0; i < 5; i++) {
          const log = new THREE.CylinderGeometry(
            0.13,
            0.18,
            3.5 - layer * 0.55,
            10,
          );
          log.rotateZ(Math.PI / 2);
          log.rotateY(layer % 2 ? Math.PI / 2 : 0);
          put(
            b,
            "wood",
            log,
            4 + (layer % 2 ? i * 0.35 - 0.7 : 0),
            0.7 + layer * 0.26,
            -1 + (layer % 2 ? 0 : i * 0.35 - 0.7),
          );
        }
      for (let i = 0; i < 7; i++)
        sphere(
          b,
          i % 2 ? "fireOrange" : "flame",
          4 + Math.sin(i * 2.4) * 0.55,
          1.9 + (i % 3) * 0.25,
          -1 + Math.cos(i * 2.4) * 0.5,
          0.35,
          0.6,
          2.3,
          0.6,
        );
      for (let i = 0; i < 3; i++) {
        const x = 2.3 + i * 1.6;
        bowl(b, x, 0.55, 2.3, 0.6);
        sphere(
          b,
          ["rosePowder", "yellowPowder", "violetPowder"][i],
          x,
          0.85,
          2.3,
          0.5,
          1,
          0.5,
          1,
        );
      }
      {
        const tube = new THREE.CylinderGeometry(0.095, 0.095, 1.7, 12);
        tube.rotateZ(Math.PI / 2);
        put(b, "brass", tube, 7, 0.73, 1.5);
        const handle = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
        handle.rotateZ(Math.PI / 2);
        put(b, "wood", handle, 8.1, 0.73, 1.5);
      }
      break;
    case "gujarati-new-year":
    case "nutan-varsh":
      for (const x of [1, 7]) column(b, x, -3, 5.5, 0.5, 0.9);
      arch(b, 4, -3, 5.8, 5.5, 0.5);
      garland(b, 4, 5.7, -2.7, 6);
      flowers(b, 4, 0.54, -0.5, 2.7);
      flowers(b, 4, 0.54, -0.5, 1.7);
      for (let i = 0; i < 12; i++)
        diya(
          b,
          4 + Math.cos((i / 12) * Math.PI * 2) * 2.7,
          0.58,
          -0.5 + Math.sin((i / 12) * Math.PI * 2) * 2.7,
          1.1,
        );
      break;
    case "pushpadolotsav":
      cradle(b, "creamFlower");
      for (let i = 0; i < 5; i++) {
        const x = 1.5 + i * 1.25;
        bowl(b, x, 0.55, 1.3, 0.54);
        sphere(
          b,
          [
            "rosePowder",
            "yellowPowder",
            "redPowder",
            "greenPowder",
            "violetPowder",
          ][i],
          x,
          0.8,
          1.3,
          0.44,
          1,
          0.4,
          1,
        );
      }
      garland(b, 4, 4.6, -4, 7, "rosePowder");
      garland(b, 4, 5.4, -4, 8);
      break;
    case "ram-navami":
      cradle(b, "creamFlower");
      break;
    case "swaminarayan-jayanti":
    case "hari-jayanti":
      cradle(b, "saffron");
      garland(b, 4, 5.1, -0.2, 5, "redPowder");
      break;
    case "janmashtami":
      cradle(b, "blueCloth");
      for (const x of [1, 7]) diya(b, x, 0.55, 0.5, 1.4);
      break;
    case "maha-shivratri":
    case "shivratri":
      // An original Shivaling object study, not a replica of a particular sanctum.
      displayTable(b, "creamFlower");
      sphere(b, "darkStone", 4, 1.3, -1, 0.95, 1.25, 0.18, 1);
      box(b, "darkStone", 5, 1.3, -1, 1.2, 0.14, 0.32);
      cyl(b, "darkStone", 4, 1.83, -1, 0.45, 1.05, 28);
      sphere(b, "darkStone", 4, 2.35, -1, 0.45, 1, 0.65, 1);
      lathe(
        b,
        "brass",
        5.8,
        1.15,
        -1.3,
        [
          [0.2, 0],
          [0.5, 0.2],
          [0.5, 0.65],
          [0.2, 0.9],
          [0.22, 1.08],
        ],
        24,
      );
      for (let i = 0; i < 3; i++)
        sphere(
          b,
          "greenFood",
          2.5 + Math.sin(i * 2.1) * 0.3,
          1.2,
          -0.7 + Math.cos(i * 2.1) * 0.3,
          0.3,
          0.55,
          0.07,
          1,
        );
      flowers(b, 4, 0.53, -1, 2.7);
      break;
    case "raksha-bandhan": {
      displayTable(b, "creamFlower");
      const rack: Batch = new Map();
      box(rack, "paper", 0, 0, 0, 5.6, 0.12, 3.1);
      for (const z of [-0.95, 0, 0.95]) {
        for (const offset of [-0.045, 0.045])
          box(rack, "redPowder", 0, 0.12, z + offset, 4.9, 0.055, 0.045);
        torus(rack, "brass", 0, 0.15, z, 0.31, 0.065, 20);
        sphere(rack, "redPowder", 0, 0.18, z, 0.21, 1, 0.35, 1);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          sphere(
            rack,
            "brass",
            Math.cos(a) * 0.37,
            0.17,
            z + Math.sin(a) * 0.37,
            0.1,
            1,
            0.5,
            1,
          );
        }
        for (const x of [-2.45, 2.45])
          for (const dz of [-0.13, 0, 0.13])
            box(rack, "saffron", x, 0.13, z + dz, 0.35, 0.05, 0.035);
      }
      for (const [material, geometries] of rack)
        for (const geometry of geometries) {
          geometry.rotateX(Math.PI / 5);
          put(b, material, geometry, 4, 1.7, -1);
        }
      diya(b, 7, 1.2, -2.3, 1.3);
      break;
    }
    case "guru-purnima":
      bookStand(b);
      flowers(b, 4, 0.53, -1, 2.5);
      garland(b, 4, 4.6, -4, 6);
      box(b, "wood", 4, 0.8, -4, 2.8, 0.4, 1.2);
      box(b, "saffron", 4, 1.05, -4, 2.6, 0.1, 1.1);
      break;
    case "rath-yatra":
      box(b, "wood", 4, 1.3, -1, 4, 0.45, 3);
      for (const x of [2.2, 5.8])
        for (const z of [-2.5, 0.5]) {
          const wheel = new THREE.TorusGeometry(0.64, 0.15, 6, 24);
          wheel.rotateY(Math.PI / 2);
          put(b, "wood", wheel, x, 0.8, z);
          for (let a = 0; a < 8; a++) {
            const spoke = new THREE.BoxGeometry(0.12, 1.16, 0.09);
            spoke.rotateX((a / 8) * Math.PI * 2);
            put(b, "brass", spoke, x, 0.8, z);
          }
        }
      for (const x of [2.5, 5.5])
        for (const z of [-2, 0]) column(b, x, z, 3, 1.5, 0.6);
      cornice(b, 4, -1, 4.2, 3.3, 4.6);
      dome(b, 4, 5.2, -1, 1.8, 1.3);
      garland(b, 4, 4.2, 0.1, 3);
      break;
    case "makar-sankranti":
    case "uttarayan":
      for (let i = 0; i < 5; i++) {
        const x = 1 + i * 1.7,
          y = 3.8 + (i % 3) * 1.25,
          z = -2 - (i % 2) * 2;
        const shape = new THREE.Shape();
        shape.moveTo(0, 0.9);
        shape.lineTo(0.6, 0);
        shape.lineTo(0, -0.75);
        shape.lineTo(-0.6, 0);
        shape.closePath();
        put(
          b,
          ["saffron", "blueCloth", "redPowder", "greenPowder", "violetPowder"][
            i
          ],
          new THREE.ShapeGeometry(shape),
          x,
          y,
          z,
        );
        const string = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, y, z),
          new THREE.Vector3(4, 0.8, 0),
        ]);
        const curve = new THREE.LineCurve3(
          new THREE.Vector3(x, y, z),
          new THREE.Vector3(4, 0.8, 0),
        );
        put(b, "paper", new THREE.TubeGeometry(curve, 1, 0.008, 3, false));
        string.dispose();
      }
      for (const x of [3, 5]) {
        cyl(b, "wood", x, 0.8, 0, 0.35, 0.55, 16);
        cyl(b, "redPowder", x, 0.8, 0, 0.29, 0.4, 16);
      }
      break;
    case "navratri":
      displayTable(b, "saffron");
      for (const x of [2.35, 5.65])
        for (const rotation of [-0.72, 0.72]) {
          const stick = new THREE.CylinderGeometry(0.095, 0.095, 2.9, 12);
          stick.rotateZ(Math.PI / 2);
          stick.rotateY(rotation);
          put(b, "redPowder", stick, x, 1.32, -1);
          for (const d of [-1.25, -0.9, -0.45, 0, 0.45, 0.9, 1.25]) {
            const band = new THREE.CylinderGeometry(0.103, 0.103, 0.13, 12);
            band.rotateZ(Math.PI / 2);
            band.rotateY(rotation);
            put(
              b,
              "creamFlower",
              band,
              x + Math.cos(rotation) * d,
              1.32,
              -1 - Math.sin(rotation) * d,
            );
          }
        }
      flowers(b, 4, 0.54, -1, 3.5);
      break;
  }
  return storyStage(b, palette);
}

export function makeFestivalCourt(palette: Palette): WorldBuilt {
  const colors: Record<string, string> = {
    darkStone: "#383634",
    wood: "#70452d",
    terracotta: "#b15c3b",
    brass: "#a88446",
    saffron: "#d59737",
    blueCloth: "#477b8f",
    paper: "#f5e4bb",
    marigold: "#eba32e",
    creamFlower: "#fff1cf",
    rosePowder: "#d7688a",
    redPowder: "#af3c35",
    yellowPowder: "#ebba45",
    greenPowder: "#7b9d4b",
    violetPowder: "#795289",
    rice: "#f1e1c4",
    sweet: "#d69e4b",
    greenFood: "#76934d",
    fruit: "#e27f39",
    fireOrange: "#f69837",
  };
  for (const [name, color] of Object.entries(colors))
    palette[name] = new THREE.MeshStandardMaterial({
      color,
      roughness: name === "brass" ? 0.45 : 0.82,
      metalness: name === "brass" ? 0.3 : 0,
      side: THREE.DoubleSide,
      emissive: name === "fireOrange" ? color : 0,
      emissiveIntensity: name === "fireOrange" ? 0.65 : 0,
    });
  const group = new THREE.Group(),
    b: Batch = new Map();
  box(b, "floor", 1, -0.3, -1, 36, 0.55, 38);
  box(b, "ivory", 1, 0.01, -1, 29, 0.06, 31);
  for (let x = -12; x < 15; x += 1.5)
    box(b, "joint", x, 0.045, -1, 0.018, 0.008, 30);
  for (let z = -15; z < 15; z += 1.5)
    box(b, "joint", 1, 0.046, z, 28, 0.008, 0.018);
  for (const z of [-13, -8, -3, 2, 7])
    for (const x of [-8, 12]) {
      column(b, x, z, 6.2);
      if (z < 7) arch(b, x, z + 2.5, 4.7, 6.2, 0, Math.PI / 2);
    }
  for (const x of [-8, 12]) cornice(b, x, -3, 2.6, 24, 6.3);
  for (const x of [-6, -1, 4, 9]) {
    column(b, x, -13, 6.2);
    if (x < 9) arch(b, x + 2.5, -13, 4.8, 6.2);
    lattice(b, x + 1.2, -14, 2.1, 2, 1);
  }
  cornice(b, 1.5, -13, 19, 3.5, 6.3);
  for (const x of [-4, 4, 10]) {
    for (const dx of [-1.4, 1.4]) column(b, x + dx, -13, 2.4, 7, 0.7);
    arch(b, x, -13, 2.7, 2.4, 7);
    dome(b, x, 9.8, -13, 2.1, 1.1);
  }
  for (const x of [-4, 6]) column(b, x, 10, 8.7, 0, 1.5);
  arch(b, 1, 10, 9.8, 8.7);
  cornice(b, 1, 10, 12, 2.3, 8.85);
  box(b, "rose", 4, 0.2, -1, 9.5, 0.3, 8);
  box(b, "ivory", 4, 0.42, -1, 9.7, 0.14, 8.2);
  box(b, "rose", 4, 0.08, 4, 6, 0.16, 1.6);
  // A mandir beyond the exhibition courtyard gives the celebrations a devotional setting.
  box(b, "rose", 4, 6, -18, 11, 8, 4);
  cornice(b, 4, -18, 12, 5, 10);
  templeSpire(b, 4, 10.7, -18, 3, 7.5);
  templeSpire(b, 0.7, 10.2, -18, 1.4, 4.2);
  templeSpire(b, 7.3, 10.2, -18, 1.4, 4.2);
  finish(b, palette, group);
  return {
    group,
    flames: [],
    bridgeFlames: [],
    storyStages: festivals.map((f) => tableau(f.id, palette)),
  };
}
