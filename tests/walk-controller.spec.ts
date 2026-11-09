import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { CAMPUS_EYE_HEIGHT } from "../lib/campus";
import { campusDoor, walkSurfaceAt } from "../lib/campus-navigation";
import { createCampusWalkController } from "../lib/campus-walk-controller";
import { INITIAL_WALK_STATE, type WalkState } from "../lib/campus-walk";

test("automatic walking follows all six complete routes at eye height without a shortcut", () => {
  // A real controller and Three camera run on a deterministic clock. Only the
  // DOM event surfaces are stubbed: no WebGL renderer or browser is involved.
  const saved = new Map<string, PropertyDescriptor | undefined>();
  const replace = (name: string, value: unknown) => {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  };
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0, now = 1000;
  const host = Object.assign(new EventTarget(), { focus() {} });
  const canvas = Object.assign(new EventTarget(), {
    dataset: {} as Record<string, string>,
    style: { touchAction: "pan-y" },
    hasPointerCapture() { return false; },
    releasePointerCapture() {},
  });
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    querySelector() { return null; },
    body: new EventTarget(),
    activeElement: host,
  });
  let controller: ReturnType<typeof createCampusWalkController> | undefined;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  let latest: WalkState = INITIAL_WALK_STATE;
  let renderedSamples = 0;
  let visitorBarrier = false;
  const blocked: string[] = [];
  try {
    replace("window", new EventTarget());
    replace("document", doc);
    replace("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    replace("cancelAnimationFrame", (id: number) => frames.delete(id));
    controller = createCampusWalkController({
      host: host as unknown as HTMLElement,
      canvas: canvas as unknown as HTMLCanvasElement,
      camera,
      scene,
      buildings: [],
      canTraverse: (_from, to) => !visitorBarrier || to.z >= 45.8,
      onRender() {
        const surface = walkSurfaceAt(camera.position.x, camera.position.z);
        if (surface === null) throw new Error(`Camera left a walkable route at ${camera.position.x},${camera.position.z}`);
        if (Math.abs(camera.position.y - surface - CAMPUS_EYE_HEIGHT) > 0.000001)
          throw new Error("Walking camera lost its calibrated eye height");
        renderedSamples++;
      },
      onChange(state) {
        latest = state;
        if (state.status.includes("blocked")) blocked.push(state.status);
      },
    });
    controller.setEnabled({ enabled: true, suspended: false, reducedMotion: false });
    for (let id = 1; id <= 6; id++) {
      controller.resetEntrance();
      expect(controller.routeToDome(id)).toBe(true);
      expect(latest.automatic).toBe(true);
      let iterations = 0;
      while (frames.size) {
        if (++iterations > 20_000) throw new Error(`Dome ${id} automatic route failed to finish`);
        const next = [...frames.entries()];
        frames.clear();
        now += 50;
        for (const [, callback] of next) callback(now);
      }
      const door = campusDoor(id).outside;
      expect(latest.nearDome).toBe(id);
      expect(latest.automatic).toBe(false);
      expect(latest.moving).toBe(false);
      expect(latest.position[0]).toBeCloseTo(door.x, 5);
      expect(latest.position[2]).toBeCloseTo(door.z, 5);
      expect(latest.position[1]).toBeCloseTo(door.y + CAMPUS_EYE_HEIGHT, 5);
    }
    expect(blocked).toEqual([]);
    expect(renderedSamples).toBeGreaterThan(1000);
    // A stationary visitor must also stop the camera when crowd animation is
    // paused. Exercise automatic movement and both keyboard motion modes.
    controller.resetEntrance();
    visitorBarrier = true;
    expect(controller.routeToPoint({ x: 0, z: 45 })).toBe(true);
    for (let iteration = 0; frames.size && iteration < 200; iteration++) {
      const next = [...frames.values()];
      frames.clear();
      now += 50;
      next.forEach(callback => callback(now));
    }
    expect(latest.automatic).toBe(false);
    expect(latest.position[2]).toBeGreaterThanOrEqual(45.8);
    expect(latest.status).toContain("blocked");
    const key = (type: string, value: string) => {
      const event = new Event(type, { cancelable: true });
      Object.defineProperties(event, { key: { value }, target: { value: host } });
      window.dispatchEvent(event);
    };
    controller.resetEntrance();
    key("keydown", "w");
    for (let iteration = 0; iteration < 50; iteration++) {
      const next = [...frames.values()];
      frames.clear();
      now += 50;
      next.forEach(callback => callback(now));
    }
    key("keyup", "w");
    expect(latest.position[2]).toBeGreaterThanOrEqual(45.8);
    controller.setEnabled({ enabled: true, suspended: false, reducedMotion: true });
    controller.resetEntrance();
    for (let index = 0; index < 4; index++) key("keydown", "w");
    expect(latest.position[2]).toBeGreaterThanOrEqual(45.8);
    expect(latest.position[2]).toBeLessThan(46);
    controller.setEnabled({ enabled: false, suspended: false, reducedMotion: false });
    expect(canvas.style.touchAction).toBe("pan-y");
    expect(frames.size).toBe(0);
  } finally {
    controller?.dispose();
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
