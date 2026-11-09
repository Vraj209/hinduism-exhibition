"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type SoundGraph = {
  context: AudioContext;
  source: AudioBufferSourceNode;
  highPass: BiquadFilterNode;
  lowPass: BiquadFilterNode;
  output: GainNode;
};

export type AmbientSound = {
  /** The visitor's choice; temporarily muted while paused. Never persisted. */
  enabled: boolean;
  available: boolean;
  toggle: () => Promise<void>;
  error: string | null;
};

const subscribeSupport = () => () => {};
const serverSupport = () => false;
const browserSupport = () => Boolean(audioContextConstructor());

function audioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  );
}

function ramp(
  parameter: AudioParam,
  target: number,
  context: AudioContext,
  seconds: number,
) {
  const now = context.currentTime;
  // cancelAndHoldAtTime is not available in every supported browser.
  if (typeof parameter.cancelAndHoldAtTime === "function")
    parameter.cancelAndHoldAtTime(now);
  else {
    const current = parameter.value;
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(current, now);
  }
  parameter.linearRampToValueAtTime(target, now + seconds);
}

function tune(graph: SoundGraph, sectionId: number) {
  // A soft synthesized air/water texture, not a recording or a religious motif.
  const cutoff =
    [430, 360, 250, 620, 480, 300][Math.max(0, Math.min(5, sectionId - 1))] ??
    430;
  ramp(graph.lowPass.frequency, cutoff, graph.context, 0.8);
}

function createGraph(Context: typeof AudioContext): SoundGraph {
  const context = new Context({ latencyHint: "playback" });
  const source = context.createBufferSource();
  const highPass = context.createBiquadFilter();
  const lowPass = context.createBiquadFilter();
  const output = context.createGain();
  try {
    const sampleRate = 22050;
    const length = sampleRate * 12;
    const buffer = context.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const samples = buffer.getChannelData(channel);
      let previous = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        previous = (previous + white * 0.03) / 1.03;
        // A smooth loop boundary avoids clicks without requiring a worklet or timer.
        const edge = Math.min(
          1,
          i / (sampleRate * 0.2),
          (length - 1 - i) / (sampleRate * 0.2),
        );
        samples[i] = previous * 3 * edge * edge * (3 - 2 * edge);
      }
    }
    source.buffer = buffer;
    source.loop = true;
    highPass.type = "highpass";
    highPass.frequency.value = 75;
    highPass.Q.value = 0.3;
    lowPass.type = "lowpass";
    lowPass.frequency.value = 430;
    lowPass.Q.value = 0.35;
    output.gain.value = 0;
    source
      .connect(highPass)
      .connect(lowPass)
      .connect(output)
      .connect(context.destination);
    source.start();
    return { context, source, highPass, lowPass, output };
  } catch (error) {
    source.disconnect();
    highPass.disconnect();
    lowPass.disconnect();
    output.disconnect();
    void context.close().catch(() => {});
    throw error;
  }
}

/**
 * Optional ambience for a mounted section world. Call toggle directly from the
 * sound button's click handler. The graph is not created before that gesture.
 * Pause mutes temporarily; returning from a hidden tab requires a fresh gesture.
 */
export function useAmbientSound(
  sectionId: number,
  paused: boolean,
): AmbientSound {
  const available = useSyncExternalStore(
    subscribeSupport,
    browserSupport,
    serverSupport,
  );
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const graphRef = useRef<SoundGraph | null>(null);
  const desiredRef = useRef(false);
  const pausedRef = useRef(paused);
  const sectionRef = useRef(sectionId);
  const mountedRef = useRef(false);
  const operationRef = useRef(0);
  const suspendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelSuspend = useCallback(() => {
    if (suspendTimer.current !== null) clearTimeout(suspendTimer.current);
    suspendTimer.current = null;
  }, []);

  const fadeOut = useCallback(
    (graph: SoundGraph) => {
      cancelSuspend();
      if (graph.context.state === "closed") return;
      ramp(graph.output.gain, 0, graph.context, 0.12);
      if (graph.context.state !== "running") return;
      suspendTimer.current = setTimeout(() => {
        suspendTimer.current = null;
        if (
          graphRef.current === graph &&
          (!desiredRef.current || pausedRef.current || document.hidden)
        ) {
          void graph.context.suspend().catch(() => {});
        }
      }, 150);
    },
    [cancelSuspend],
  );

  const resume = useCallback(
    async (graph: SoundGraph, operation: number) => {
      cancelSuspend();
      try {
        await graph.context.resume();
        if (!mountedRef.current || graphRef.current !== graph) return;
        if (operation !== operationRef.current) {
          // A late resume may complete after the visitor already turned sound off.
          if (!desiredRef.current || pausedRef.current || document.hidden)
            fadeOut(graph);
          return;
        }
        if (!desiredRef.current || pausedRef.current || document.hidden) {
          fadeOut(graph);
          return;
        }
        tune(graph, sectionRef.current);
        ramp(graph.output.gain, 0.055, graph.context, 0.65);
      } catch {
        if (!mountedRef.current || operation !== operationRef.current) return;
        desiredRef.current = false;
        setEnabled(false);
        setError("Sound could not start. You can continue with sound off.");
      }
    },
    [cancelSuspend, fadeOut],
  );

  useEffect(() => {
    mountedRef.current = true;
    const onVisibility = () => {
      if (!document.hidden) return;
      // Deliberately do not resume when the tab becomes visible again.
      operationRef.current += 1;
      desiredRef.current = false;
      setEnabled(false);
      if (graphRef.current) fadeOut(graphRef.current);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mountedRef.current = false;
      desiredRef.current = false;
      operationRef.current += 1;
      document.removeEventListener("visibilitychange", onVisibility);
      cancelSuspend();
      const graph = graphRef.current;
      graphRef.current = null;
      if (graph) {
        const release = () => {
          try {
            graph.source.stop();
          } catch {
            /* Already stopped by a closed context. */
          }
          graph.source.disconnect();
          graph.highPass.disconnect();
          graph.lowPass.disconnect();
          graph.output.disconnect();
          void graph.context.close().catch(() => {});
        };
        if (graph.context.state === "running") {
          ramp(graph.output.gain, 0, graph.context, 0.025);
          // This brief release owns no React state and always closes its graph.
          setTimeout(release, 40);
        } else release();
      }
    };
  }, [cancelSuspend, fadeOut]);

  useEffect(() => {
    sectionRef.current = sectionId;
    const graph = graphRef.current;
    if (graph && graph.context.state !== "closed") tune(graph, sectionId);
  }, [sectionId]);

  useEffect(() => {
    pausedRef.current = paused;
    const graph = graphRef.current;
    if (!graph) return;
    const operation = ++operationRef.current;
    if (paused || !desiredRef.current || document.hidden) fadeOut(graph);
    else void resume(graph, operation);
  }, [paused, fadeOut, resume]);

  const toggle = useCallback(async () => {
    if (!mountedRef.current) return;
    const operation = ++operationRef.current;
    const next = !desiredRef.current;
    desiredRef.current = next;
    setEnabled(next);
    setError(null);
    if (!next) {
      if (graphRef.current) fadeOut(graphRef.current);
      return;
    }
    const Context = audioContextConstructor();
    if (!Context) {
      desiredRef.current = false;
      setEnabled(false);
      setError("Ambient sound is not available in this browser.");
      return;
    }
    try {
      // This is the only graph-creation path, reached from an explicit gesture.
      const graph = graphRef.current ?? createGraph(Context);
      graphRef.current = graph;
      tune(graph, sectionRef.current);
      await resume(graph, operation);
    } catch {
      if (!mountedRef.current || operation !== operationRef.current) return;
      desiredRef.current = false;
      setEnabled(false);
      setError("Sound could not start. You can continue with sound off.");
    }
  }, [fadeOut, resume]);

  return { enabled, available, toggle, error };
}
