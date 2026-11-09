"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeCampusLandscape } from "@/lib/campus-landscape";
import { makeCampusSky } from "@/lib/campus-sky";
import { makeRobbinsvilleMandir } from "@/lib/robbinsville-mandir";
import { campusLayout, pavilions, CAMPUS_EYE_HEIGHT, CAMPUS_METERS_PER_UNIT, CAMPUS_LOOK_LIMIT } from "@/lib/campus";
import { makeDomedPavilion } from "@/lib/domed-pavilion";
import {
  sampleCampusWind,
  sampleSideFountainSound,
  type CampusEnvironmentSample,
} from "@/lib/campus-environment";
import { updateCampusPennant } from "@/lib/campus-pennant";

export type CampusPosition = {
  id: number;
  x: number;
  y: number;
  visible: boolean;
};
export type CampusSceneProps = {
  selected: number | null;
  hovered: number | null;
  reducedMotion: boolean;
  environmentPaused?: boolean;
  view: "arrival" | "map";
  zoom: number;
  lookOffset: number;
  onLookChange: (yaw: number) => void;
  onReady: () => void;
  onError: () => void;
  onSettled: (id: number | null) => void;
  onPositions: (positions: CampusPosition[]) => void;
  onSelect: (id: number) => void;
  onEnvironment?: (sample: CampusEnvironmentSample) => void;
};

type Palette = Record<string, THREE.MeshStandardMaterial>;
type SceneApi = {
  move: (id: number | null, instant: boolean, zoom: number) => void;
  highlight: (id: number | null) => void;
  resize: () => void;
  environmentMotion: () => void;
  look: (yaw: number, instant?: boolean) => void;
};

const ACTIVE_PAVILIONS = 6;

function makePavilion(id: number, palette: Palette) {
  const group = makeDomedPavilion(id, palette);
  group.position.set(...pavilions[id - 1].position);
  group.rotation.y = pavilions[id - 1].rotation;
  return group;
}

export default function CampusScene(props: CampusSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  const apiRef = useRef<SceneApi | null>(null);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      propsRef.current.onError();
      return;
    }
    let disposed = false;
    let frame = 0;
    let lookFrame = 0;
    let lookYaw = THREE.MathUtils.clamp(propsRef.current.lookOffset, -CAMPUS_LOOK_LIMIT, CAMPUS_LOOK_LIMIT);
    let deferredLook: number | null = null;
    let moving = false;
    const mobile = window.innerWidth < 768;
    let renderCount = 0;
    let environmentTime = 0;
    let environmentLast = 0;
    let environmentFrame = 0;
    let lastShadowTime = -1;
    let lastAudioTime = -1;
    let inViewport = true;
    let transitionVisibility: ((hidden: boolean) => void) | null = null;
    let maxRenderCalls = 0;
    let maxRenderTriangles = 0;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#ece9dd", 0.003);
    const overviewCamera = new THREE.OrthographicCamera(
      -26,
      26,
      20,
      -20,
      0.1,
      220,
    );
    const entranceCamera = new THREE.PerspectiveCamera(56, 1, 0.03, 650);
    let camera: THREE.OrthographicCamera | THREE.PerspectiveCamera =
      propsRef.current.view === "map" ? overviewCamera : entranceCamera;
    const initialPose =
      propsRef.current.view === "map"
        ? campusLayout.overhead
        : campusLayout.arrival;
    const cameraTarget = new THREE.Vector3(...initialPose.target);
    overviewCamera.position.fromArray(campusLayout.overhead.position);
    overviewCamera.zoom = propsRef.current.zoom;
    overviewCamera.lookAt(new THREE.Vector3(...campusLayout.overhead.target));
    entranceCamera.position.fromArray(campusLayout.arrival.position);
    if (camera === entranceCamera) cameraTarget.copy(heroTarget(lookYaw));
    entranceCamera.lookAt(cameraTarget);
    const overviewPose = {
      position: camera.position.clone(),
      target: cameraTarget.clone(),
      zoom: propsRef.current.zoom,
    };
    let requestedId: number | null | undefined;
    let requestedZoom = propsRef.current.zoom;
    let requestedView = propsRef.current.view;
    let transitionVersion = 0;
    let cameraPhase:
      | "overview"
      | "exiting"
      | "approach"
      | "relief"
      | "threshold"
      | "inside"
      | "returning" = "overview";
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.25 : 1.5),
    );
    renderer.setClearColor(0xf4f0e8, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // Foliage and cloth use the same deformation in the shadow pass. Refresh at
    // a capped cadence rather than rebuilding the full campus shadow every frame.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.cssText =
      "display:block;width:100%;height:100%;touch-action:pan-y;";
    host.appendChild(renderer.domElement);
    const palette: Palette = {};
    const colors: Record<string, string> = {
      ground: "#e8e3d7",
      plaza: "#e5dcca",
      path: "#f1e6d4",
      pathLine: "#c8bba7",
      rose: "#bd8a70",
      roseDark: "#91614d",
      ivory: "#efe5d4",
      pale: "#fff7e6",
      gold: "#9a7842",
      wood: "#70452d",
      woodLight: "#9b6842",
      water: "#739b91",
      flowerCream: "#eee0bb",
      flowerRose: "#b77572",
      flowerGold: "#d3ac57",
      lamp: "#ffe5ad",
      jet: "#d2e4dd",
      grass: "#a5b589",
      hedge: "#6a7e48",
      leaves: "#72885b",
      leavesDark: "#536e43",
      leavesLight: "#8d9b6a",
      leavesOlive: "#77845a",
      trunk: "#75614b",
      soil: "#b9ab88",
    };
    const grain = new Uint8Array(64 * 64 * 4);
    let grainSeed = 7;
    for (let i = 0; i < grain.length; i += 4) {
      grainSeed = (grainSeed * 16807) % 2147483647;
      const value = 185 + (grainSeed % 70);
      grain[i] = value;
      grain[i + 1] = value;
      grain[i + 2] = value;
      grain[i + 3] = 255;
    }
    const stoneTexture = new THREE.DataTexture(grain, 64, 64);
    stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
    stoneTexture.repeat.set(4, 4);
    stoneTexture.magFilter = THREE.LinearFilter;
    stoneTexture.needsUpdate = true;
    for (const [key, color] of Object.entries(colors)) {
      const stone = ["rose", "ivory", "pale", "roseDark"].includes(key);
      palette[key] = new THREE.MeshStandardMaterial({
        color,
        roughness: key === "water" ? 0.3 : 0.85,
        metalness: key === "gold" ? 0.35 : 0,
        bumpMap: stone ? stoneTexture : null,
        bumpScale: 0.025,
      });
    }
    palette.lamp.emissive.set("#e9bc6b");
    palette.lamp.emissiveIntensity = 0.65;
    palette.jet.transparent = true;
    palette.jet.opacity = 0.5;
    palette.jet.roughness = 0.22;
    palette.jet.depthWrite = false;
    scene.add(new THREE.HemisphereLight("#fff7e8", "#9c9a7f", 1.35));
    const sunlight = new THREE.DirectionalLight("#fff0d5", 2.65);
    sunlight.position.set(-42, 50, 24);
    sunlight.target.position.set(0, 0, -18);
    scene.add(sunlight.target);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    sunlight.shadow.camera.left = -60;
    sunlight.shadow.camera.right = 60;
    sunlight.shadow.camera.top = 60;
    sunlight.shadow.camera.bottom = -60;
    sunlight.shadow.camera.near = 1;
    sunlight.shadow.camera.far = 170;
    sunlight.shadow.normalBias = 0.035;
    sunlight.shadow.bias = -0.0001;
    sunlight.shadow.radius = 3;
    scene.add(sunlight);
    const fill = new THREE.DirectionalLight("#fff8ee", 0.45);
    fill.position.set(20, 15, -30);
    scene.add(fill);
    const sky = makeCampusSky(mobile);
    scene.add(sky.group);
    sunlight.intensity = 2.65 * sky.update(0);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ color: "#8f7b5f", opacity: 0.09 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.57;
    ground.receiveShadow = true;
    scene.add(ground);
    // A continuous ground plane meets the level horizon; the designed campus
    // sits above it rather than floating as a miniature on a blank background.
    const horizonGround = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ color: "#a1ad88", roughness: 1 }));
    horizonGround.rotation.x = -Math.PI / 2;
    horizonGround.position.y = -0.56;
    horizonGround.receiveShadow = true;
    scene.add(horizonGround);
    const landscape = makeCampusLandscape(palette, { mobile });
    scene.add(landscape.group);
    const mandir = makeRobbinsvilleMandir(palette);
    mandir.position.set(...campusLayout.mandir);
    scene.add(mandir);
    const pennants: THREE.Mesh[] = [];
    mandir.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.campusPennant)
        pennants.push(object);
    });
    const buildings = pavilions
      .slice(0, ACTIVE_PAVILIONS)
      .map((p) => makePavilion(p.id, palette));
    buildings.forEach((building) => scene.add(building));
    sky.attachShadows(scene);
    landscape.captureReflection(renderer, scene);
    let geometryTriangles = 0;
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh)
        geometryTriangles +=
          (object.geometry.index?.count ??
            object.geometry.getAttribute("position").count) / 3;
    });
    renderer.domElement.dataset.geometryTriangles = String(geometryTriangles);
    const highlightGeometry = new THREE.RingGeometry(3.5, 3.62, 64);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: "#aa7a42",
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.rotation.x = -Math.PI / 2;
    highlight.visible = false;
    scene.add(highlight);

    function projectLabels() {
      camera.updateMatrixWorld();
      const positions = pavilions.map((p) => {
        const roofAnchor = propsRef.current.view === "map" ? 10.25 : 11.2;
        const point = new THREE.Vector3(
          p.position[0],
          roofAnchor,
          p.position[2],
        ).project(camera);
        return {
          id: p.id,
          x: (point.x + 1) * 50,
          y: (1 - point.y) * 50,
          visible:
            point.z > -1 &&
            point.z < 1 &&
            Math.abs(point.x) < 1 &&
            Math.abs(point.y) < 1,
        };
      });
      propsRef.current.onPositions(positions);
    }
    function render(updateLabels = true) {
      if (disposed || document.hidden) return;
      renderer.render(scene, camera);
      renderer.domElement.dataset.renderCount = String(++renderCount);
      renderer.domElement.dataset.environmentTime = environmentTime.toFixed(3);
      renderer.domElement.dataset.motion = environmentEnabled()
        ? "ambient"
        : "still";
      renderer.domElement.dataset.environmentQuality = mobile
        ? "mobile"
        : "desktop";
      renderer.domElement.dataset.environmentDetails = JSON.stringify(
        landscape.diagnostics,
      );
      const skyState = sky.snapshot();
      renderer.domElement.dataset.sideFountains = JSON.stringify(landscape.diagnostics.sideFountainBounds);
      renderer.domElement.dataset.centralFountainCount = String(campusLayout.fountains.length);
      renderer.domElement.dataset.skyDetails = JSON.stringify(sky.diagnostics);
      renderer.domElement.dataset.skyTime = skyState.time.toFixed(4);
      renderer.domElement.dataset.cloudOffset = JSON.stringify(skyState.offset);
      renderer.domElement.dataset.cloudShadowOffset = JSON.stringify(skyState.shadowOffset);
      renderer.domElement.dataset.sunlightIntensity = sunlight.intensity.toFixed(6);
      renderer.domElement.dataset.driftingLeaves = String(
        landscape.diagnostics.driftingLeaves,
      );
      renderer.domElement.dataset.jetDroplets = String(
        landscape.diagnostics.jetDroplets,
      );
      renderer.domElement.dataset.splashDroplets = String(
        landscape.diagnostics.splashDroplets,
      );
      publishEnvironment();
      maxRenderCalls = Math.max(maxRenderCalls, renderer.info.render.calls);
      maxRenderTriangles = Math.max(
        maxRenderTriangles,
        renderer.info.render.triangles,
      );
      renderer.domElement.dataset.maxDrawCalls = String(maxRenderCalls);
      renderer.domElement.dataset.maxRenderTriangles =
        String(maxRenderTriangles);
      renderer.domElement.dataset.triangles = String(
        renderer.info.render.triangles,
      );
      renderer.domElement.dataset.drawCalls = String(
        renderer.info.render.calls,
      );
      renderer.domElement.dataset.campusLayout = "axial";
      renderer.domElement.dataset.campusView = requestedView;
      renderer.domElement.dataset.mandirPosition =
        campusLayout.mandir.join(",");
      renderer.domElement.dataset.pavilionPositions = JSON.stringify(
        pavilions.map(({ id, position, rotation }) => ({
          id,
          position,
          rotation,
        })),
      );
      renderer.domElement.dataset.lookOffset = lookYaw.toFixed(4);
      renderer.domElement.dataset.eyeHeightMeters = (CAMPUS_EYE_HEIGHT * CAMPUS_METERS_PER_UNIT).toFixed(3);
      renderer.domElement.dataset.metersPerUnit = CAMPUS_METERS_PER_UNIT.toFixed(9);
      renderer.domElement.dataset.cameraZoom = camera.zoom.toFixed(3);
      renderer.domElement.dataset.cameraType =
        camera === overviewCamera ? "orthographic" : "perspective";
      renderer.domElement.dataset.cameraPhase = cameraPhase;
      renderer.domElement.dataset.cameraFov =
        camera === entranceCamera ? entranceCamera.fov.toFixed(3) : "0";
      renderer.domElement.dataset.overviewZoom = overviewPose.zoom.toFixed(3);
      renderer.domElement.dataset.cameraTarget = cameraTarget
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",");
      renderer.domElement.dataset.cameraPosition = camera.position
        .toArray()
        .map((n) => n.toFixed(3))
        .join(",");
      if (updateLabels) projectLabels();
    }
    function heroFov(aspect: number) {
      // A portrait screen needs more vertical field for the same comfortable
      // horizontal/diagonal view. This frames the twin fountains without raising
      // the camera or changing architecture; blend smoothly through square sizes.
      const wideFov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(44)) / aspect));
      const blended = THREE.MathUtils.lerp(94, wideFov, THREE.MathUtils.smoothstep(aspect, 0.75, 1.4));
      const diagonalLimit = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(52.5)) / Math.hypot(1, aspect)));
      return Math.min(blended, diagonalLimit);
    }
    function heroShift(aspect: number) {
      return THREE.MathUtils.lerp(-0.08, -0.14, THREE.MathUtils.smoothstep(aspect, 0.75, 1.4));
    }
    function heroTarget(yaw: number) {
      const position = new THREE.Vector3(...campusLayout.arrival.position);
      return position.add(new THREE.Vector3(Math.sin(yaw) * 95, 0, -Math.cos(yaw) * 95));
    }
    function heroProjection() {
      entranceCamera.fov = heroFov(entranceCamera.aspect);
      entranceCamera.zoom = 1;
      const width = host!.clientWidth || 800, height = host!.clientHeight || 600;
      // Shift the lens, not the camera: architectural verticals remain parallel.
      entranceCamera.setViewOffset(width, height, 0, height * heroShift(entranceCamera.aspect), width, height);
      entranceCamera.updateProjectionMatrix();
    }
    function applyLook(yaw: number) {
      lookYaw = THREE.MathUtils.clamp(yaw, -CAMPUS_LOOK_LIMIT, CAMPUS_LOOK_LIMIT);
      cameraTarget.copy(heroTarget(lookYaw));
      entranceCamera.lookAt(cameraTarget);
      overviewPose.position.copy(entranceCamera.position);
      overviewPose.target.copy(cameraTarget);
      render();
    }
    function look(yaw: number, instant = false) {
      if (propsRef.current.selected !== null || requestedView !== "arrival") return;
      const target = THREE.MathUtils.clamp(yaw, -CAMPUS_LOOK_LIMIT, CAMPUS_LOOK_LIMIT);
      if (moving) { deferredLook = target; return; }
      cancelAnimationFrame(lookFrame);
      deferredLook = null;
      if (instant || propsRef.current.reducedMotion) { applyLook(target); return; }
      const start = lookYaw, began = performance.now();
      const tickLook = (now: number) => {
        const t = Math.min(1, (now - began) / 260);
        applyLook(THREE.MathUtils.lerp(start, target, t * t * (3 - 2 * t)));
        if (t < 1) lookFrame = requestAnimationFrame(tickLook);
      };
      lookFrame = requestAnimationFrame(tickLook);
    }
    function resize() {
      const width = host!.clientWidth || 800;
      const height = host!.clientHeight || 600;
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const span = Math.max(116, 68 / aspect);
      overviewCamera.left = (-span * aspect) / 2;
      overviewCamera.right = (span * aspect) / 2;
      overviewCamera.top = span / 2;
      overviewCamera.bottom = -span / 2;
      overviewCamera.updateProjectionMatrix();
      entranceCamera.aspect = aspect;
      if (camera === entranceCamera && propsRef.current.selected === null && !moving && requestedView === "arrival") heroProjection();
      else entranceCamera.updateProjectionMatrix();
      render();
    }
    const soundDirection = new THREE.Vector3();
    const soundRight = new THREE.Vector3();
    const fountainPoint = new THREE.Vector3();
    function publishEnvironment(force = false) {
      const now = performance.now();
      if (!force && now - lastAudioTime < 100) return;
      lastAudioTime = now;
      const wind = sampleCampusWind(environmentTime);
      // Distance and stereo are derived from the actual camera pose; no preset
      // sound jump when a visitor selects a pavilion or changes map view.
      soundRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      let nearest = Infinity;
      let pan = 0;
      let totalWeight = 0;
      for (const z of campusLayout.fountains) {
        fountainPoint.set(0, 0.2, z);
        soundDirection.copy(fountainPoint).sub(camera.position);
        const distance = soundDirection.length() / camera.zoom;
        nearest = Math.min(nearest, distance);
        const weight = 1 / (1 + distance * distance * 0.006);
        pan += soundDirection.normalize().dot(soundRight) * weight;
        totalWeight += weight;
      }
      const waterPresence = 0.12 + 0.88 / (1 + Math.pow(nearest / 22, 1.65));
      const waterPan = THREE.MathUtils.clamp(
        pan / Math.max(0.01, totalWeight),
        -0.7,
        0.7,
      );
      const outdoor =
        cameraPhase === "inside" ? 0 : cameraPhase === "threshold" ? 0.22 : 1;
      renderer.domElement.dataset.windStrength = wind.strength.toFixed(4);
      renderer.domElement.dataset.windGust = wind.gust.toFixed(4);
      renderer.domElement.dataset.waterPresence = waterPresence.toFixed(4);
      renderer.domElement.dataset.waterPan = waterPan.toFixed(4);
      const sideFountains = sampleSideFountainSound(campusLayout.sideFountains, camera.position, soundRight, camera.zoom);
      renderer.domElement.dataset.sideFountainSound = JSON.stringify(sideFountains);
      propsRef.current.onEnvironment?.({
        time: environmentTime,
        wind,
        waterPresence,
        waterPan,
        sideFountains,
        outdoor,
      });
    }
    function environmentEnabled() {
      return (
        !disposed &&
        !document.hidden &&
        inViewport &&
        !propsRef.current.reducedMotion &&
        !propsRef.current.environmentPaused &&
        cameraPhase !== "inside"
      );
    }
    function updateEnvironment(now: number) {
      const elapsed = environmentLast
        ? Math.min(0.1, (now - environmentLast) / 1000)
        : 0;
      environmentLast = now;
      environmentTime += elapsed;
      const wind = sampleCampusWind(environmentTime);
      landscape.update(environmentTime);
      sunlight.intensity = 2.65 * sky.update(environmentTime);
      pennants.forEach((pennant) =>
        updateCampusPennant(pennant, environmentTime, wind),
      );
      if (environmentTime - lastShadowTime >= (mobile ? 0.25 : 0.125)) {
        renderer.shadowMap.needsUpdate = true;
        lastShadowTime = environmentTime;
      }
    }
    function environmentMotion() {
      cancelAnimationFrame(environmentFrame);
      environmentLast = 0;
      renderer.domElement.dataset.motion = environmentEnabled()
        ? "ambient"
        : "still";
      if (!environmentEnabled()) return;
      const tickEnvironment = (now: number) => {
        if (!environmentEnabled()) {
          renderer.domElement.dataset.motion = "still";
          return;
        }
        if (
          !environmentLast ||
          now - environmentLast >= (mobile ? 50 : 1000 / 30)
        ) {
          updateEnvironment(now);
          if (!moving) render(false);
        }
        environmentFrame = requestAnimationFrame(tickEnvironment);
      };
      environmentFrame = requestAnimationFrame(tickEnvironment);
    }
    landscape.update(0);
    pennants.forEach((pennant) =>
      updateCampusPennant(pennant, 0, sampleCampusWind(0)),
    );
    function visibilityChanged() {
      environmentMotion();
      transitionVisibility?.(document.hidden);
      if (!document.hidden && !moving) render();
    }
    document.addEventListener("visibilitychange", visibilityChanged);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting;
        environmentMotion();
      },
      { rootMargin: "80px" },
    );
    intersection.observe(host);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    function cubicEase(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function matchingOverviewFov(
      position: THREE.Vector3,
      target: THREE.Vector3,
      zoom: number,
    ) {
      const verticalSpan = (overviewCamera.top - overviewCamera.bottom) / zoom;
      const distance = Math.max(0.1, position.distanceTo(target));
      return THREE.MathUtils.radToDeg(
        2 * Math.atan(verticalSpan / (2 * distance)),
      );
    }
    function activateEntranceCamera() {
      if (camera === entranceCamera) {
        // Fade the off-axis shift out during approach rather than tilting the idle view.
        return;
      }
      // Match the orthographic vertical span at its target plane before moving.
      // The pose itself is preserved, including when a map-zoom move is interrupted.
      entranceCamera.position.copy(camera.position);
      entranceCamera.quaternion.copy(camera.quaternion);
      entranceCamera.fov = matchingOverviewFov(
        camera.position,
        cameraTarget,
        camera.zoom,
      );
      entranceCamera.zoom = 1;
      entranceCamera.clearViewOffset();
      entranceCamera.updateProjectionMatrix();
      camera = entranceCamera;
    }
    function entrancePoints(id: number) {
      const pavilion = pavilions[id - 1];
      const rotation = new THREE.Euler(0, pavilion.rotation, 0);
      const offset = (x: number, y: number, z: number) =>
        new THREE.Vector3(x, y, z).applyEuler(rotation);
      const point = (x: number, y: number, z: number) =>
        offset(x, y, z).add(new THREE.Vector3(...pavilion.position));
      const reliefFov = entranceCamera.aspect < 1 ? 61 : 48;
      return {
        reliefFov,
        offset,
        // The final approach starts beside the garden and follows the inward-facing doorway.
        approach: point(0, 3.8, 8.8),
        reliefTarget: point(0, 3.7, 2.7),
        inside: point(0, 2.3, 1),
        doorwayTarget: point(0, 2.3, -1),
        insideTarget: point(0, 2.2, -6),
      };
    }
    function move(id: number | null, instant: boolean, zoom: number) {
      if (id !== null && !pavilions[id - 1]) return;
      const unchangedView = requestedView === propsRef.current.view;
      const unchangedSelection = requestedId === id;
      const unchangedZoom = requestedZoom === zoom;
      // A layout/view update must not restart the entrance or duplicate its callback.
      if (
        unchangedSelection &&
        unchangedZoom &&
        unchangedView &&
        (!instant || !moving)
      )
        return;
      if (unchangedSelection && id !== null && !unchangedZoom && !instant) {
        requestedZoom = zoom;
        overviewPose.zoom = zoom;
        return;
      }
      const previousId = requestedId;
      const previousPhase = cameraPhase;
      requestedId = id;
      requestedZoom = zoom;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(lookFrame);
      const version = ++transitionVersion;
      moving = false;
      if (id !== null || !unchangedView) deferredLook = null;
      if (id !== null && previousId == null) {
        overviewPose.position.copy(camera.position);
        overviewPose.target.copy(cameraTarget);
      }
      overviewPose.zoom = zoom;
      // The selected camera mode persists independently of the exhibition hash.
      // Returning from a section restores the saved pose rather than deriving one from #map.
      if (id === null && !unchangedView) {
        const pose =
          propsRef.current.view === "map"
            ? campusLayout.overhead
            : campusLayout.arrival;
        overviewPose.position.fromArray(pose.position);
        overviewPose.target.copy(propsRef.current.view === "arrival" ? heroTarget(propsRef.current.lookOffset) : new THREE.Vector3(...pose.target));
        requestedView = propsRef.current.view;
        camera = requestedView === "map" ? overviewCamera : entranceCamera;
        camera.position.copy(overviewPose.position);
        cameraTarget.copy(overviewPose.target);
        if (camera === entranceCamera) { lookYaw = propsRef.current.lookOffset; heroProjection(); }
        else { overviewCamera.zoom = zoom; overviewCamera.updateProjectionMatrix(); }
        camera.lookAt(cameraTarget);
        cameraPhase = "overview";
        render();
        propsRef.current.onSettled(null);
        return;
      }
      requestedView = propsRef.current.view;
      highlightPavilion(id);

      if (id !== null) activateEntranceCamera();
      const startPosition = camera.position.clone();
      const startTarget = cameraTarget.clone();
      const startZoom = camera.zoom;
      const startFov = entranceCamera.fov;
      const startShift = entranceCamera.view?.enabled ? entranceCamera.view.offsetY / entranceCamera.view.fullHeight : 0;
      let started = performance.now();
      let hiddenAt: number | null = null;
      const usesPerspective = camera === entranceCamera;
      const changingSection =
        id !== null &&
        previousId != null &&
        previousId !== id &&
        (previousPhase === "inside" || previousPhase === "threshold");
      const duration = instant
        ? 0
        : changingSection
          ? 2550
          : id !== null
            ? 2000
            : usesPerspective
              ? 1100
              : 300;
      // A brief highlight identifies the chosen building before the approach begins.
      const highlightHold = id !== null && !instant ? 60 : 0;
      const entry = id !== null ? entrancePoints(id) : null;
      const exit =
        previousId != null &&
        previousId !== id &&
        (previousPhase === "inside" || previousPhase === "threshold")
          ? entrancePoints(previousId)
          : null;
      const approachStart = exit?.approach ?? startPosition;
      const approachTarget = exit?.reliefTarget ?? startTarget;
      const approachFov = exit?.reliefFov ?? startFov;
      const approachCurve = entry
        ? new THREE.CubicBezierCurve3(
            approachStart,
            approachStart
              .clone()
              .lerp(entry.approach, 0.36)
              .setY(Math.max(approachStart.y, 7)),
            entry.approach.clone().add(entry.offset(0, 6, 4)),
            entry.approach,
          )
        : null;
      const thresholdCurve = entry
        ? new THREE.CubicBezierCurve3(
            entry.approach,
            entry.approach.clone().add(entry.offset(0, -0.35, -3)),
            entry.inside.clone().add(entry.offset(0, 0, 2)),
            entry.inside,
          )
        : null;
      const exitCurve = exit
        ? new THREE.CubicBezierCurve3(
            startPosition,
            startPosition.clone().add(exit.offset(0, 0, 3)),
            exit.approach.clone().add(exit.offset(0, -0.3, -3)),
            exit.approach,
          )
        : null;
      const returnStart = exit?.approach ?? startPosition;
      const returnCurve = new THREE.CubicBezierCurve3(
        returnStart,
        returnStart.clone().add(new THREE.Vector3(0, 3, 5)),
        overviewPose.position.clone().lerp(returnStart, 0.28),
        overviewPose.position,
      );
      cameraPhase =
        id !== null ? "approach" : usesPerspective ? "returning" : "overview";
      moving = true;
      const tick = (now: number) => {
        if (disposed || version !== transitionVersion) return;
        if (document.hidden) {
          hiddenAt ??= now;
          return;
        }
        if (hiddenAt !== null) {
          started += now - hiddenAt;
          hiddenAt = null;
        }
        const elapsed = Math.max(0, now - started - highlightHold);
        const t =
          duration === 0
            ? 1
            : Math.min(1, elapsed / Math.max(1, duration - highlightHold));
        const eased = cubicEase(t);
        if (entry && approachCurve && thresholdCurve) {
          // Approximately 450 ms of genuinely stationary relief viewing separates
          // the approach from the doorway pass. It is cancellable on every frame.
          const approachEnd = 0.39;
          const reliefEnd = 0.62;
          const exitEnd = exitCurve ? 0.2 : 0;
          const entryTime = Math.max(0, (t - exitEnd) / (1 - exitEnd));
          if (exitCurve && exit && t < exitEnd) {
            const phase = cubicEase(t / exitEnd);
            entranceCamera.position.copy(exitCurve.getPoint(phase));
            cameraTarget.lerpVectors(startTarget, exit.reliefTarget, phase);
            entranceCamera.fov = THREE.MathUtils.lerp(
              startFov,
              exit.reliefFov,
              phase,
            );
            cameraPhase = "exiting";
          } else if (entryTime < approachEnd) {
            const phase = cubicEase(entryTime / approachEnd);
            entranceCamera.position.copy(approachCurve.getPoint(phase));
            cameraTarget.lerpVectors(approachTarget, entry.reliefTarget, phase);
            entranceCamera.fov = THREE.MathUtils.lerp(
              approachFov,
              entry.reliefFov,
              phase,
            );
            cameraPhase = "approach";
          } else if (entryTime < reliefEnd) {
            entranceCamera.position.copy(entry.approach);
            cameraTarget.copy(entry.reliefTarget);
            entranceCamera.fov = entry.reliefFov;
            cameraPhase = "relief";
          } else {
            const phase = cubicEase((entryTime - reliefEnd) / (1 - reliefEnd));
            entranceCamera.position.copy(thresholdCurve.getPoint(phase));
            cameraTarget.lerpVectors(
              entry.reliefTarget,
              entry.insideTarget,
              phase,
            );
            entranceCamera.fov = THREE.MathUtils.lerp(
              entry.reliefFov,
              48,
              phase,
            );
            cameraPhase = t === 1 ? "inside" : "threshold";
          }
          const width = host!.clientWidth || 800, height = host!.clientHeight || 600;
          entranceCamera.setViewOffset(width, height, 0, height * startShift * (1 - Math.min(1, t / 0.35)), width, height);
          entranceCamera.updateProjectionMatrix();
        } else if (usesPerspective) {
          const split = exitCurve ? 0.34 : 0;
          if (exitCurve && exit && eased < split) {
            entranceCamera.position.copy(exitCurve.getPoint(eased / split));
            cameraTarget.lerpVectors(
              startTarget,
              exit.doorwayTarget,
              cubicEase(eased / split),
            );
          } else {
            const phase = (eased - split) / (1 - split);
            entranceCamera.position.copy(returnCurve.getPoint(phase));
            cameraTarget.lerpVectors(
              exit?.doorwayTarget ?? startTarget,
              overviewPose.target,
              cubicEase(phase),
            );
          }
          // Recompute against the latest viewport so resizing cannot leave a stale frustum.
          const endFov = requestedView === "map" ? matchingOverviewFov(
            overviewPose.position,
            overviewPose.target,
            zoom,
          ) : heroFov(entranceCamera.aspect);
          entranceCamera.fov = THREE.MathUtils.lerp(startFov, endFov, eased);
          const width = host!.clientWidth || 800, height = host!.clientHeight || 600;
          const endShift = requestedView === "map" ? 0 : heroShift(entranceCamera.aspect);
          entranceCamera.setViewOffset(width, height, 0, height * THREE.MathUtils.lerp(startShift, endShift, eased), width, height);
          entranceCamera.updateProjectionMatrix();
          if (t === 1) {
            overviewCamera.position.copy(overviewPose.position);
            overviewCamera.zoom = zoom;
            cameraTarget.copy(overviewPose.target);
            overviewCamera.lookAt(cameraTarget);
            overviewCamera.updateProjectionMatrix();
            camera = requestedView === "map" ? overviewCamera : entranceCamera;
            if (camera === entranceCamera) {
              entranceCamera.position.copy(overviewPose.position);
              heroProjection();
              entranceCamera.lookAt(cameraTarget);
            }
            cameraPhase = "overview";
          }
        } else {
          overviewCamera.position.lerpVectors(
            startPosition,
            overviewPose.position,
            eased,
          );
          cameraTarget.lerpVectors(startTarget, overviewPose.target, eased);
          overviewCamera.zoom = THREE.MathUtils.lerp(startZoom, zoom, eased);
          overviewCamera.updateProjectionMatrix();
        }
        camera.lookAt(cameraTarget);
        render();
        if (t < 1) frame = requestAnimationFrame(tick);
        else {
          moving = false;
          transitionVisibility = null;
          publishEnvironment(true);
          environmentMotion();
          if (id === null && deferredLook !== null) look(deferredLook);
          if (version === transitionVersion && propsRef.current.selected === id)
            propsRef.current.onSettled(id);
        }
      };
      transitionVisibility = (hidden) => {
        cancelAnimationFrame(frame);
        if (hidden) hiddenAt ??= performance.now();
        else if (moving && !disposed) frame = requestAnimationFrame(tick);
      };
      // Even instant direct links settle on a frame, after the parent's effects
      // have recorded the selected ID; reduced motion still performs no animation.
      frame = requestAnimationFrame(tick);
    }
    function highlightPavilion(id: number | null) {
      id = propsRef.current.selected ?? id;
      highlight.visible = id !== null;
      highlightMaterial.opacity =
        propsRef.current.selected !== null ? 0.78 : 0.55;
      if (id !== null) {
        highlight.position.set(
          pavilions[id - 1].position[0],
          0.02,
          pavilions[id - 1].position[2],
        );
        highlight.scale.setScalar(1.15);
      }
      if (!moving) render();
    }
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number; yaw: number; id: number; dragging: boolean } | null = null;
    function pointerDown(event: PointerEvent) {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) || propsRef.current.selected !== null || moving) return;
      down = { x: event.clientX, y: event.clientY, yaw: lookYaw, id: event.pointerId, dragging: false };
    }
    function pointerMove(event: PointerEvent) {
      if (!down || event.pointerId !== down.id || requestedView !== "arrival") return;
      const dx = event.clientX - down.x, dy = event.clientY - down.y;
      if (!down.dragging && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        down.dragging = true;
        renderer.domElement.setPointerCapture(event.pointerId);
      }
      if (!down.dragging) return;
      const yaw = THREE.MathUtils.clamp(down.yaw - dx * 0.0018, -CAMPUS_LOOK_LIMIT, CAMPUS_LOOK_LIMIT);
      look(yaw, true);
      propsRef.current.onLookChange(yaw);
    }
    function pointerUp(event: PointerEvent) {
      if (!down || event.pointerId !== down.id) return;
      const gesture = down;
      down = null;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      if (gesture.dragging || Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 7) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(buildings, true)[0];
      if (hit?.object.userData.pavilionId) propsRef.current.onSelect(hit.object.userData.pavilionId);
    }
    function pointerCancel() { down = null; }
    function keyLook(event: KeyboardEvent) {
      if (event.target !== host || requestedView !== "arrival" || propsRef.current.selected !== null) return;
      const delta = event.key === "ArrowLeft" ? -0.1 : event.key === "ArrowRight" ? 0.1 : null;
      if (delta === null && event.key !== "Home") return;
      event.preventDefault();
      propsRef.current.onLookChange(event.key === "Home" ? 0 : THREE.MathUtils.clamp(lookYaw + delta!, -CAMPUS_LOOK_LIMIT, CAMPUS_LOOK_LIMIT));
    }
    function contextLost(event: Event) {
      event.preventDefault();
      propsRef.current.onError();
    }
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointercancel", pointerCancel);
    host.addEventListener("keydown", keyLook);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    apiRef.current = {
      move,
      highlight: highlightPavilion,
      resize,
      environmentMotion,
      look,
    };
    environmentMotion();
    resize();
    propsRef.current.onReady();
    move(propsRef.current.selected, true, propsRef.current.zoom);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(lookFrame);
      cancelAnimationFrame(environmentFrame);
      document.removeEventListener("visibilitychange", visibilityChanged);
      intersection.disconnect();
      landscape.dispose();
      sky.dispose();
      observer.disconnect();
      apiRef.current = null;
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointercancel", pointerCancel);
      host.removeEventListener("keydown", keyLook);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      const materials = new Set<THREE.Material>(Object.values(palette));
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => materials.add(material));
        }
      });
      materials.forEach((material) => material.dispose());
      sunlight.shadow.dispose();
      stoneTexture.dispose();
      highlightMaterial.dispose();
      (ground.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    apiRef.current?.resize();
    apiRef.current?.move(props.selected, props.reducedMotion, props.zoom);
    apiRef.current?.environmentMotion();
  }, [
    props.selected,
    props.reducedMotion,
    props.environmentPaused,
    props.zoom,
    props.view,
  ]);
  useEffect(() => {
    apiRef.current?.look(props.lookOffset);
  }, [props.lookOffset, props.reducedMotion]);
  useEffect(() => {
    apiRef.current?.highlight(props.hovered ?? props.selected);
  }, [props.hovered, props.selected]);
  return (
    <div
      ref={hostRef}
      className="campus-webgl"
      tabIndex={props.selected === null && props.view === "arrival" ? 0 : -1}
      role="region"
      aria-label="Campus view. Drag horizontally or use left and right arrow keys to look around. Home resets the view."
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
