import * as THREE from "three";
import { CAMPUS_EYE_HEIGHT, CAMPUS_METERS_PER_UNIT, campusLayout } from "./campus";
import {
  campusDoor,
  findCampusPath,
  moveOnCampus,
  nearbyCampusDoor,
  nearestWalkable,
  walkSurfaceAt,
  type WalkPoint,
} from "./campus-navigation";
import type { WalkPose, WalkState } from "./campus-walk";

type WalkControllerOptions = {
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  buildings: THREE.Object3D[];
  onRender: (target: THREE.Vector3) => void;
  onChange: (state: WalkState) => void;
  onApproach?: (id: number) => void;
  /** Additional dynamic clearance, such as visitors standing on the paving. */
  canTraverse?: (from: WalkPoint, to: WalkPoint) => boolean;
};

const movementKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
const lookKeys = new Set(["q", "e", "r", "f"]);
const maxSpeed = 1.4 / CAMPUS_METERS_PER_UNIT;
const pitchLimit = 0.35;
const waypointTolerance = 0.00001;

/** Deliberate walking only. The shared navigation module owns all traversability
 * and route validation; this controller never moves directly across obstacles. */
export function createCampusWalkController(options: WalkControllerOptions) {
  const { host, canvas, camera, scene, buildings, onRender, onChange, onApproach, canTraverse } = options;
  let enabled = false;
  let suspended = false;
  let reducedMotion = false;
  let disposed = false;
  let frame = 0;
  let previousTick = 0;
  let lastPublished = -Infinity;
  let poseProvidedWhileDisabled = false;
  let yaw = 0;
  let pitch = 0;
  let point: WalkPoint = {
    x: campusLayout.arrival.position[0],
    y: campusLayout.arrival.position[1] - CAMPUS_EYE_HEIGHT,
    z: campusLayout.arrival.position[2],
  };
  let route: WalkPoint[] = [];
  let routeIndex = 0;
  let targetDome: number | null = null;
  let destination: WalkPoint | null = null;
  let automaticSpeed = 0;
  let blockedTime = 0;
  let autoFaceRoute = true;
  let status = "Choose a path or an exhibition dome.";
  let pointer: { id: number; x: number; y: number; yaw: number; pitch: number; dragging: boolean } | null = null;
  const keys = new Set<string>();
  const velocity = new THREE.Vector2();
  const target = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.02);
  const rayGround = new THREE.Vector3();
  const preloaded = new Set<number>();
  const oldTouchAction = canvas.style.touchAction;
  const markerGeometry = new THREE.RingGeometry(0.19, 0.25, 36);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: "#c08a47", transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.name = "Walking destination marker";
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  marker.renderOrder = 4;
  scene.add(marker);

  function dialogOpen() {
    return !!document.querySelector("dialog[open],[aria-modal='true']:not([hidden])");
  }
  function active() {
    return enabled && !suspended && !disposed && !document.hidden && !dialogOpen();
  }
  function remainingDistance() {
    if (!route.length) return 0;
    let distance = Math.hypot(route[routeIndex].x - point.x, route[routeIndex].z - point.z);
    for (let index = routeIndex + 1; index < route.length; index++)
      distance += Math.hypot(route[index].x - route[index - 1].x, route[index].z - route[index - 1].z);
    return distance;
  }
  function publish(force = false) {
    const now = performance.now();
    if (!force && now - lastPublished < 100) return;
    lastPublished = now;
    const nearDome = enabled ? nearbyCampusDoor(point) : null;
    const state: WalkState = {
      moving: active() && (route.length > 0 || velocity.lengthSq() > 0.000001),
      automatic: active() && route.length > 0,
      nearDome,
      targetDome,
      distanceRemaining: remainingDistance() * CAMPUS_METERS_PER_UNIT,
      status: nearDome && !route.length ? `Dome ${nearDome} entrance. You can enter the exhibition.` : status,
      position: [point.x, point.y + CAMPUS_EYE_HEIGHT, point.z],
    };
    canvas.dataset.walking = String(enabled);
    canvas.dataset.walkSuspended = String(suspended);
    canvas.dataset.walkAutomatic = String(state.automatic);
    canvas.dataset.walkMoving = String(state.moving);
    canvas.dataset.walkPosition = state.position.map(value => value.toFixed(4)).join(",");
    canvas.dataset.walkSurface = point.y.toFixed(4);
    canvas.dataset.walkYaw = yaw.toFixed(4);
    canvas.dataset.walkPitch = pitch.toFixed(4);
    canvas.dataset.walkNearDome = String(nearDome ?? "");
    canvas.dataset.walkTargetDome = String(targetDome ?? "");
    canvas.dataset.walkDistance = state.distanceRemaining.toFixed(2);
    canvas.dataset.walkRoute = JSON.stringify(route.slice(routeIndex).map(({ x, y, z }) => [x, y, z]));
    canvas.dataset.walkDestination = destination ? JSON.stringify([destination.x, destination.y, destination.z]) : "";
    canvas.dataset.walkMarkerVisible = String(marker.visible);
    onChange(state);
  }
  function preloadNearby() {
    for (let id = 1; id <= 6; id++) {
      if (preloaded.has(id)) continue;
      const door = campusDoor(id).outside;
      if (Math.hypot(door.x - point.x, door.z - point.z) < 12) {
        preloaded.add(id);
        onApproach?.(id);
      }
    }
  }
  function render() {
    if (!enabled || suspended || disposed) return;
    camera.position.set(point.x, point.y + CAMPUS_EYE_HEIGHT, point.z);
    target.set(
      camera.position.x + Math.sin(yaw) * Math.cos(pitch) * 10,
      camera.position.y + Math.sin(pitch) * 10,
      camera.position.z - Math.cos(yaw) * Math.cos(pitch) * 10,
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    onRender(target);
    preloadNearby();
    publish();
  }
  function clearMovement() {
    keys.clear();
    velocity.set(0, 0);
    automaticSpeed = 0;
    blockedTime = 0;
    route = [];
    routeIndex = 0;
    destination = null;
    targetDome = null;
    marker.visible = false;
    canvas.dataset.walkRoute = "[]";
    cancelAnimationFrame(frame);
    frame = 0;
    previousTick = 0;
  }
  function stop() {
    clearMovement();
    status = "Stopped. Choose another path or exhibition dome.";
    render();
    publish(true);
  }
  function manualDirection() {
    const forward = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
    const sideways = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    return new THREE.Vector2(Math.sin(yaw) * forward + Math.cos(yaw) * sideways, -Math.cos(yaw) * forward + Math.sin(yaw) * sideways).normalize();
  }
  function requestFrame() {
    if (!frame && active()) frame = requestAnimationFrame(tick);
  }
  function moveWithClearance(from: WalkPoint, dx: number, dz: number, slide = false) {
    if (!canTraverse) return moveOnCampus(from, dx, dz);
    // Check the whole movement in short sweeps, including the longer discrete
    // steps used with reduced motion. Static navigation remains authoritative.
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.04));
    const stepX = dx / steps, stepZ = dz / steps;
    let current = from;
    for (let index = 0; index < steps; index++) {
      const next = moveOnCampus(current, stepX, stepZ);
      if (canTraverse(current, next)) { current = next; continue; }
      if (!slide) break;
      const axes = Math.abs(stepX) >= Math.abs(stepZ)
        ? [[stepX, 0], [0, stepZ]] : [[0, stepZ], [stepX, 0]];
      let advanced = false;
      for (const [x, z] of axes) {
        const candidate = moveOnCampus(current, x, z);
        if (Math.hypot(candidate.x - current.x, candidate.z - current.z) > 0.000001 && canTraverse(current, candidate)) {
          current = candidate;
          advanced = true;
          break;
        }
      }
      if (!advanced) break;
    }
    return current;
  }
  function tick(now: number) {
    frame = 0;
    if (!active()) {
      clearMovement();
      publish(true);
      return;
    }
    const delta = previousTick ? Math.min(0.05, Math.max(0.001, (now - previousTick) / 1000)) : 1 / 60;
    previousTick = now;
    let moved = false;
    const turning = Number(keys.has("e")) - Number(keys.has("q"));
    const tilting = Number(keys.has("r")) - Number(keys.has("f"));
    if (turning || tilting) {
      yaw += turning * delta * 0.65;
      pitch = THREE.MathUtils.clamp(pitch + tilting * delta * 0.35, -pitchLimit, pitchLimit);
      moved = true;
    }
    if (route.length) {
      // Reach each validated corner before following the next segment. Skipping
      // a nearly reached corner can shave clearance around a basin or ramp edge.
      while (routeIndex < route.length - 1 && Math.hypot(route[routeIndex].x - point.x, route[routeIndex].z - point.z) < waypointTolerance) routeIndex++;
      const next = route[routeIndex];
      const dx = next.x - point.x, dz = next.z - point.z;
      const distance = Math.hypot(dx, dz);
      const remaining = remainingDistance();
      const speedTarget = Math.min(maxSpeed, Math.max(0.05, remaining * 1.6));
      automaticSpeed = THREE.MathUtils.lerp(automaticSpeed, speedTarget, 1 - Math.exp(-delta * 7));
      const step = Math.min(distance, automaticSpeed * delta);
      const before = point;
      if (distance > 0.00001) point = moveWithClearance(point, dx / distance * step, dz / distance * step);
      const translated = Math.hypot(point.x - before.x, point.z - before.z) > 0.000001;
      moved = moved || translated;
      blockedTime = translated || distance < waypointTolerance ? 0 : blockedTime + delta;
      if (autoFaceRoute && distance > 0.025) {
        const desired = Math.atan2(dx, -dz);
        const angle = Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw));
        yaw += THREE.MathUtils.clamp(angle, -delta * 1.3, delta * 1.3);
        moved = true;
      }
      if (remaining < waypointTolerance) {
        point = { ...route.at(-1)! };
        route = [];
        routeIndex = 0;
        automaticSpeed = 0;
        if (targetDome && autoFaceRoute) yaw = campusDoor(targetDome).yaw;
        status = targetDome ? `Arrived at Dome ${targetDome}.` : "Arrived. Tap another path to continue.";
        publish(true);
        moved = true;
      } else if (blockedTime > 0.4 && distance > waypointTolerance) {
        stop();
        status = "The path is blocked. Choose another destination.";
        publish(true);
      }
    } else {
      const direction = manualDirection().multiplyScalar(maxSpeed);
      const easing = 1 - Math.exp(-delta * (direction.lengthSq() ? 7 : 12));
      velocity.lerp(direction, easing);
      if (velocity.length() < 0.001) velocity.set(0, 0);
      if (velocity.lengthSq() > 0) {
        const next = moveWithClearance(point, velocity.x * delta, velocity.y * delta, true);
        const translated = Math.hypot(next.x - point.x, next.z - point.z) > 0.000001;
        moved = moved || translated;
        point = next;
        if (!translated) velocity.set(0, 0);
      }
    }
    if (moved) render();
    publish();
    if (route.length || keys.size || velocity.lengthSq() > 0) requestFrame();
    else { previousTick = 0; publish(true); }
  }
  function showDestination(next: WalkPoint) {
    marker.position.set(next.x, next.y + 0.035, next.z);
    marker.visible = active();
  }
  function startRoute(next: { x: number; z: number }, dome: number | null) {
    if (!active()) return false;
    const path = findCampusPath(point, next);
    if (!path?.length) {
      status = "Choose a clear path or a dome entrance.";
      publish(true);
      return false;
    }
    clearMovement();
    route = path;
    routeIndex = 0;
    targetDome = dome;
    destination = { ...path.at(-1)! };
    autoFaceRoute = true;
    status = dome ? `Walking to Dome ${dome}.` : "Walking to the selected path.";
    showDestination(destination);
    if (reducedMotion) goDirectly();
    else {
      render();
      publish(true);
      requestFrame();
    }
    return true;
  }
  function routeToPoint(next: { x: number; z: number }) {
    const snapped = nearestWalkable(next, 0.3);
    return snapped ? startRoute(snapped, null) : false;
  }
  function routeToDome(id: number) {
    if (!Number.isInteger(id) || id < 1 || id > 6) return false;
    const door = campusDoor(id);
    return startRoute(door.outside, id);
  }
  function goDirectly() {
    if (!active() || !destination) return;
    const next = { ...destination };
    const id = targetDome;
    // The destination was accepted only after a complete collision-safe route.
    // This explicit shortcut is also used for reduced-motion preferences.
    clearMovement();
    point = next;
    targetDome = id;
    destination = next;
    if (id) { yaw = campusDoor(id).yaw; pitch = 0; }
    status = id ? `Arrived at Dome ${id}.` : "Arrived at the selected path.";
    showDestination(next);
    render();
    publish(true);
  }
  function getPose(): WalkPose {
    return { position: [point.x, point.y + CAMPUS_EYE_HEIGHT, point.z], yaw, pitch };
  }
  function setPose(pose: WalkPose) {
    clearMovement();
    const valid = nearestWalkable({ x: pose.position[0], z: pose.position[2] }, 2);
    if (!valid) return false;
    point = valid;
    yaw = pose.yaw;
    pitch = THREE.MathUtils.clamp(pose.pitch, -pitchLimit, pitchLimit);
    poseProvidedWhileDisabled = !enabled;
    status = "Choose a path or an exhibition dome.";
    render();
    publish(true);
    return true;
  }
  function resetEntrance() {
    return setPose({ position: [...campusLayout.arrival.position] as [number, number, number], yaw: 0, pitch: 0 });
  }
  function setEnabled(next: { enabled: boolean; suspended: boolean; reducedMotion: boolean }) {
    const wasEnabled = enabled;
    const wasSuspended = suspended;
    const wasReduced = reducedMotion;
    enabled = next.enabled;
    suspended = next.suspended;
    reducedMotion = next.reducedMotion;
    canvas.style.touchAction = enabled && !suspended ? "none" : oldTouchAction;
    if (enabled && !wasEnabled) {
      if (!poseProvidedWhileDisabled) resetEntrance();
      poseProvidedWhileDisabled = false;
    }
    if (!enabled || suspended) {
      clearMovement();
      pointerCancel();
      publish(true);
      return;
    }
    if (reducedMotion && !wasReduced) {
      if (destination && route.length) goDirectly();
      else { clearMovement(); render(); publish(true); }
    }
    if (!wasEnabled || wasSuspended) {
      render();
      publish(true);
    }
  }
  function keyboardAllowed(event: KeyboardEvent) {
    if (!active() || event.altKey || event.ctrlKey || event.metaKey) return false;
    const element = event.target;
    return element === host || element === canvas;
  }
  function keyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if ((!movementKeys.has(key) && !lookKeys.has(key) && key !== "home") || !keyboardAllowed(event)) return;
    event.preventDefault();
    if (key === "home") {
      pitch = 0;
      render();
      publish(true);
      return;
    }
    if (lookKeys.has(key)) {
      autoFaceRoute = false;
      if (reducedMotion) {
        if (event.repeat) return;
        yaw += (Number(key === "e") - Number(key === "q")) * 0.12;
        pitch = THREE.MathUtils.clamp(pitch + (Number(key === "r") - Number(key === "f")) * 0.08, -pitchLimit, pitchLimit);
        render();
        publish(true);
      } else {
        keys.add(key);
        requestFrame();
      }
      return;
    }
    if (reducedMotion) {
      if (event.repeat) return;
      clearMovement();
      keys.add(key);
      const direction = manualDirection().multiplyScalar(0.2);
      point = moveWithClearance(point, direction.x, direction.y, true);
      keys.clear();
      status = "Moved one step. Tap a destination for immediate travel.";
      render();
      publish(true);
      return;
    }
    if (route.length) {
      clearMovement();
      status = "Walking with keyboard controls.";
    }
    keys.add(key);
    marker.visible = false;
    destination = null;
    targetDome = null;
    status = "Walking with keyboard controls.";
    requestFrame();
  }
  function keyUp(event: KeyboardEvent) {
    const held = keys.delete(event.key.toLowerCase());
    if (held && active()) publish(true);
    if (active() && velocity.lengthSq() > 0) requestFrame();
  }
  function pointerDown(event: PointerEvent) {
    if (!active() || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    host.focus({ preventScroll: true });
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch, dragging: false };
  }
  function pointerMove(event: PointerEvent) {
    if (!active() || !pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (!pointer.dragging && Math.hypot(dx, dy) > 8) {
      pointer.dragging = true;
      canvas.setPointerCapture(event.pointerId);
      autoFaceRoute = false;
    }
    if (!pointer.dragging) return;
    event.preventDefault();
    yaw = pointer.yaw - dx * 0.003;
    pitch = THREE.MathUtils.clamp(pointer.pitch + dy * 0.0024, -pitchLimit, pitchLimit);
    render();
  }
  function pointerUp(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const gesture = pointer;
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!active()) return;
    if (gesture.dragging) {
      yaw = gesture.yaw - (event.clientX - gesture.x) * 0.003;
      pitch = THREE.MathUtils.clamp(gesture.pitch + (event.clientY - gesture.y) * 0.0024, -pitchLimit, pitchLimit);
      render();
      publish(true);
      return;
    }
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) return;
    const rect = canvas.getBoundingClientRect();
    pointerNdc.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointerNdc, camera);
    const ground = raycaster.ray.intersectPlane(groundPlane, rayGround);
    const building = raycaster.intersectObjects(buildings, true)[0];
    if (building && (!ground || building.distance < camera.position.distanceTo(ground))) {
      const id = Number(building.object.userData.pavilionId);
      if (id >= 1 && id <= 6) routeToDome(id);
      return;
    }
    if (!ground || camera.position.distanceTo(ground) > 180) return;
    // A fountain, bed or wall footprint is not a successful tap destination.
    if (walkSurfaceAt(ground.x, ground.z) === null) {
      status = "Tap a clear path to choose a destination.";
      publish(true);
      return;
    }
    routeToPoint(ground);
  }
  function pointerCancel() {
    const id = pointer?.id;
    pointer = null;
    if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }
  function blur() {
    if (!enabled) return;
    clearMovement();
    pointerCancel();
    status = "Stopped. Choose a path to continue.";
    if (active()) render();
    publish(true);
  }
  function focusOut(event: FocusEvent) {
    if (event.relatedTarget !== canvas && event.relatedTarget !== host) {
      keys.clear();
      velocity.set(0, 0);
      if (route.length) return;
      cancelAnimationFrame(frame);
      frame = 0;
      previousTick = 0;
      publish(true);
    }
  }
  function visibility() { if (document.hidden) blur(); }
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  host.addEventListener("focusout", focusOut);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerCancel);
  canvas.addEventListener("lostpointercapture", pointerCancel);
  publish(true);
  return {
    setEnabled, getPose, setPose, routeToDome, routeToPoint, stop, goDirectly, resetEntrance,
    dispose() {
      disposed = true;
      clearMovement();
      pointerCancel();
      canvas.style.touchAction = oldTouchAction;
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      host.removeEventListener("focusout", focusOut);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerCancel);
      canvas.removeEventListener("lostpointercapture", pointerCancel);
      marker.removeFromParent();
      markerGeometry.dispose();
      markerMaterial.dispose();
    },
  };
}
