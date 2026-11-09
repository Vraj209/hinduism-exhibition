import { campusLayout } from "./campus";

export type WalkPose = {
  /** Camera position, including the calibrated eye height above its surface. */
  position: [number, number, number];
  yaw: number;
  pitch: number;
};

export type WalkState = {
  moving: boolean;
  automatic: boolean;
  nearDome: number | null;
  targetDome: number | null;
  /** Remaining routed distance in metres. */
  distanceRemaining: number;
  status: string;
  position: [number, number, number];
};

export type WalkCommand = {
  sequence: number;
  type: "dome" | "stop" | "direct" | "entrance";
  id?: number;
};

export const INITIAL_WALK_STATE: WalkState = {
  moving: false,
  automatic: false,
  nearDome: null,
  targetDome: null,
  distanceRemaining: 0,
  status: "Choose a path or an exhibition dome.",
  position: [...campusLayout.arrival.position] as [number, number, number],
};
