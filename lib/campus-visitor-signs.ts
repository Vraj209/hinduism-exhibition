import * as THREE from "three";
import { sections } from "../content/exhibition";
import { CAMPUS_METERS_PER_UNIT, pavilions } from "./campus";

/** Wall-mounted, outside the portal and below the carved storytelling panels. */
export const CAMPUS_VISITOR_SIGN_PLACEMENT = {
  x: 1.62,
  y: 0.88 + 1.55 / CAMPUS_METERS_PER_UNIT,
  z: 2.95,
  width: 0.96 / CAMPUS_METERS_PER_UNIT,
  height: 0.48 / CAMPUS_METERS_PER_UNIT,
  depth: 0.04 / CAMPUS_METERS_PER_UNIT,
} as const;

function plaqueTexture(id: number) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const section = sections.find(section => section.id === id);
  if (!context || !section) return null;
  context.fillStyle = "#f2ead7";
  context.fillRect(0, 0, 512, 256);
  context.strokeStyle = "#a48250";
  context.lineWidth = 2;
  context.strokeRect(10, 10, 492, 236);
  context.textAlign = "center";
  context.fillStyle = "#795e36";
  context.font = "500 17px Arial, sans-serif";
  context.fillText(`EXHIBITION ${String(id).padStart(2, "0")}`, 256, 38);
  context.beginPath();
  context.moveTo(210, 52);
  context.lineTo(302, 52);
  context.stroke();

  function wrap(text: string, maxWidth: number) {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (context!.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }
  context.fillStyle = "#382c21";
  context.font = "500 32px Georgia, serif";
  const titleLines = wrap(section.title, 450);
  titleLines.forEach((line, index) => context.fillText(line, 256, titleLines.length === 1 ? 115 : 96 + index * 36));
  context.fillStyle = "#685842";
  context.font = "20px Arial, sans-serif";
  const themeLines = wrap(section.theme, 444);
  themeLines.forEach((line, index) => context.fillText(line, 256, themeLines.length === 1 ? 192 : 180 + index * 26));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Six text faces and one instanced frame draw; no new walking obstacles. */
export function makeCampusVisitorSigns() {
  const group = new THREE.Group();
  group.name = "Exhibition doorway plaques";
  const at = CAMPUS_VISITOR_SIGN_PLACEMENT;
  const frameGeometry = new THREE.BoxGeometry(at.width + 0.012, at.height + 0.012, at.depth);
  const faceGeometry = new THREE.PlaneGeometry(at.width, at.height);
  const bronze = new THREE.MeshStandardMaterial({ color: "#806542", roughness: 0.62, metalness: 0.35 });
  const frames = new THREE.InstancedMesh(frameGeometry, bronze, pavilions.length);
  frames.name = "Bronze plaque frames";
  frames.receiveShadow = true;
  group.add(frames);
  const textures: THREE.Texture[] = [];
  const faces: THREE.MeshStandardMaterial[] = [];
  for (const [index, pavilion] of pavilions.entries()) {
    const mount = new THREE.Group();
    mount.position.fromArray(pavilion.position);
    mount.rotation.y = pavilion.rotation;
    mount.updateMatrixWorld(true);
    const local = new THREE.Matrix4().makeTranslation(at.x, at.y, at.z);
    frames.setMatrixAt(index, mount.matrixWorld.clone().multiply(local));
    const texture = plaqueTexture(pavilion.id);
    if (texture) textures.push(texture);
    const material = new THREE.MeshStandardMaterial({ color: texture ? "#ffffff" : "#f2ead7", map: texture, roughness: 0.9 });
    faces.push(material);
    const face = new THREE.Mesh(faceGeometry, material);
    face.name = `Dome ${pavilion.id}: ${sections.find(section => section.id === pavilion.id)?.title ?? "Exhibition"}`;
    face.position.set(at.x, at.y, at.z + at.depth / 2 + 0.0005);
    face.receiveShadow = true;
    face.userData.pavilionId = pavilion.id;
    mount.add(face);
    group.add(mount);
  }
  frames.instanceMatrix.needsUpdate = true;
  return {
    group,
    dispose() {
      group.removeFromParent();
      textures.forEach(texture => texture.dispose());
      faces.forEach(material => material.dispose());
      bronze.dispose();
      frameGeometry.dispose();
      faceGeometry.dispose();
      frames.dispose();
    },
  };
}
