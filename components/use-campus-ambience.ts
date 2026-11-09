"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  audioContextConstructor,
  createCampusAudio,
  rampAudio,
  tuneCampusAudio,
  type CampusAudioGraph,
} from "@/lib/campus-audio";
import {
  sampleCampusWind,
  sampleSideFountainSound,
  type CampusEnvironmentSample,
} from "@/lib/campus-environment";
import { campusLayout } from "@/lib/campus";

export type CampusAmbienceStatus =
  | "off"
  | "playing"
  | "fading"
  | "suspended"
  | "unavailable";
export type CampusAmbience = {
  enabled: boolean;
  available: boolean;
  hasStarted: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  toggle: () => Promise<void>;
  updateEnvironment: (sample: CampusEnvironmentSample) => void;
  status: CampusAmbienceStatus;
  error: string | null;
  attachControls: (element: HTMLDivElement | null) => void;
};

const subscribeSupport = () => () => {};
const browserSupport = () => Boolean(audioContextConstructor());
const serverSupport = () => false;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const [entranceX, entranceY, entranceZ] = campusLayout.arrival.position;
const fallbackSideFountains = sampleSideFountainSound(
  campusLayout.sideFountains,
  { x: entranceX, y: entranceY, z: entranceZ },
  { x: 1, y: 0, z: 0 },
);

/** Visitor intent survives indoor/hidden pauses, but never persists between visits. */
export function useCampusAmbience({
  outdoors,
}: {
  outdoors: boolean;
}): CampusAmbience {
  const available = useSyncExternalStore(
    subscribeSupport,
    browserSupport,
    serverSupport,
  );
  const [enabled, setEnabled] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [volume, setVolumeState] = useState(0.48);
  const [status, setStatus] = useState<CampusAmbienceStatus>("off");
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<CampusAudioGraph | null>(null);
  const desiredRef = useRef(false);
  const outdoorsRef = useRef(outdoors);
  const volumeRef = useRef(volume);
  const mountedRef = useRef(false);
  const operationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const suspendRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sampleRef = useRef<{
    sample: CampusEnvironmentSample;
    received: number;
  } | null>(null);
  const updatesRef = useRef(0);
  const clockRef = useRef(0);

  const attachControls = useCallback((element: HTMLDivElement | null) => {
    controlsRef.current = element;
    if (element)
      element.dataset.audioContext =
        graphRef.current?.context.state ?? "not-created";
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) clearInterval(timerRef.current);
    if (suspendRef.current !== null) clearTimeout(suspendRef.current);
    timerRef.current = null;
    suspendRef.current = null;
  }, []);

  const updateEnvironment = useCallback((sample: CampusEnvironmentSample) => {
    sampleRef.current = { sample, received: performance.now() };
  }, []);

  const tick = useCallback(() => {
    const graph = graphRef.current;
    if (
      !graph ||
      graph.context.state !== "running" ||
      !desiredRef.current ||
      !outdoorsRef.current ||
      document.hidden
    )
      return;
    const now = performance.now();
    const received = sampleRef.current;
    const time = received
      ? received.sample.time + Math.max(0, now - received.received) / 1000
      : (now - clockRef.current) / 1000;
    // A still scene uses the same weather function on an independent audio clock.
    const wind =
      received && now - received.received < 400
        ? received.sample.wind
        : sampleCampusWind(time);
    const sample: CampusEnvironmentSample = {
      time,
      wind,
      waterPresence: received?.sample.waterPresence ?? 0.22,
      waterPan: received?.sample.waterPan ?? 0,
      sideFountains: received?.sample.sideFountains ?? fallbackSideFountains,
      outdoor:
        received && now - received.received < 600
          ? received.sample.outdoor
          : 1,
    };
    tuneCampusAudio(graph, sample);
    const output = clamp(sample.outdoor) * volumeRef.current * 0.58;
    rampAudio(graph.output.gain, output, graph.context, 0.35);
    const element = controlsRef.current;
    if (element) {
      element.dataset.audioContext = graph.context.state;
      element.dataset.waterPresence = sample.waterPresence.toFixed(4);
      element.dataset.waterPan = sample.waterPan.toFixed(4);
      element.dataset.sideFountainSources = String(Object.keys(graph.sideFountains).length);
      element.dataset.sideFountainAudio = JSON.stringify(
        Object.entries(graph.sideFountains).map(([id, layer]) => ({
          id,
          gain: layer.gain.gain.value,
          pan: layer.pan?.pan.value ?? 0,
          cutoff: layer.lowPass.frequency.value,
        })),
      );
      element.dataset.windStrength = wind.strength.toFixed(4);
      element.dataset.gust = wind.gust.toFixed(4);
      element.dataset.outdoorGain = output.toFixed(4);
      element.dataset.audioUpdates = String(++updatesRef.current);
    }
  }, []);

  const fadeOut = useCallback(
    (graph: CampusAudioGraph, fast = false) => {
      clearTimers();
      if (graph.context.state === "closed") return;
      if (mountedRef.current) setStatus(desiredRef.current ? "fading" : "off");
      rampAudio(graph.output.gain, 0, graph.context, fast ? 0.09 : 0.45);
      if (controlsRef.current) controlsRef.current.dataset.outdoorGain = "0";
      suspendRef.current = setTimeout(
        () => {
          suspendRef.current = null;
          if (
            graphRef.current !== graph ||
            (desiredRef.current && outdoorsRef.current && !document.hidden)
          )
            return;
          void graph.context
            .suspend()
            .then(() => {
              if (graphRef.current !== graph || !mountedRef.current) return;
              if (controlsRef.current)
                controlsRef.current.dataset.audioContext = graph.context.state;
          if (!desiredRef.current) setStatus("off");
          else if (!outdoorsRef.current || document.hidden)
            setStatus("suspended");
          else if (graph.context.state === "running") setStatus("playing");
            })
            .catch(() => {});
        },
        fast ? 120 : 490,
      );
    },
    [clearTimers],
  );

  const resume = useCallback(
    async (graph: CampusAudioGraph, operation: number) => {
      clearTimers();
      try {
        await graph.context.resume();
        if (!mountedRef.current || graphRef.current !== graph) return;
        if (
          operation !== operationRef.current ||
          !desiredRef.current ||
          !outdoorsRef.current ||
          document.hidden
        ) {
          if (!desiredRef.current || !outdoorsRef.current || document.hidden)
            fadeOut(graph, document.hidden);
          return;
        }
        setStatus("playing");
        tick();
        timerRef.current = setInterval(tick, 125);
      } catch {
        if (!mountedRef.current || operation !== operationRef.current) return;
        desiredRef.current = false;
        setEnabled(false);
        setStatus("off");
        setError("Ambience could not start. Try Enable Ambience again.");
        fadeOut(graph, true);
      }
    },
    [clearTimers, fadeOut, tick],
  );

  useEffect(() => {
    mountedRef.current = true;
    clockRef.current = performance.now();
    const onVisibility = () => {
      const graph = graphRef.current;
      if (!graph) return;
      const operation = ++operationRef.current;
      if (document.hidden || !outdoorsRef.current || !desiredRef.current)
        fadeOut(graph, document.hidden);
      else void resume(graph, operation);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mountedRef.current = false;
      desiredRef.current = false;
      operationRef.current += 1;
      clearTimers();
      document.removeEventListener("visibilitychange", onVisibility);
      const graph = graphRef.current;
      graphRef.current = null;
      if (graph) {
        if (graph.context.state === "running") {
          rampAudio(graph.output.gain, 0, graph.context, 0.025);
          setTimeout(graph.release, 40);
        } else graph.release();
      }
    };
  }, [clearTimers, fadeOut, resume]);

  useEffect(() => {
    outdoorsRef.current = outdoors;
    const graph = graphRef.current;
    if (!graph) return;
    const operation = ++operationRef.current;
    if (outdoors && desiredRef.current && !document.hidden)
      void resume(graph, operation);
    else fadeOut(graph);
  }, [outdoors, fadeOut, resume]);

  const toggle = useCallback(async () => {
    if (!mountedRef.current) return;
    const operation = ++operationRef.current;
    desiredRef.current = !desiredRef.current;
    setEnabled(desiredRef.current);
    setError(null);
    if (!desiredRef.current) {
      if (graphRef.current) fadeOut(graphRef.current);
      return;
    }
    const Context = audioContextConstructor();
    if (!Context) {
      desiredRef.current = false;
      setEnabled(false);
      setStatus("unavailable");
      setError("Ambient sound is unavailable in this browser.");
      return;
    }
    try {
      // The only construction path is called by the explicit enable button.
      const graph = graphRef.current ?? createCampusAudio(Context);
      graphRef.current = graph;
      setHasStarted(true);
      await resume(graph, operation);
    } catch {
      if (!mountedRef.current || operation !== operationRef.current) return;
      desiredRef.current = false;
      setEnabled(false);
      setStatus("off");
      setError("Ambience could not start. You can continue with sound off.");
    }
  }, [fadeOut, resume]);

  const setVolume = useCallback(
    (next: number) => {
      if (!Number.isFinite(next)) return;
      volumeRef.current = clamp(next);
      setVolumeState(volumeRef.current);
      tick();
    },
    [tick],
  );

  return {
    enabled,
    available,
    hasStarted,
    volume,
    setVolume,
    toggle,
    updateEnvironment,
    status,
    error,
    attachControls,
  };
}
