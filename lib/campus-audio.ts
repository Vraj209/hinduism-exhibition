import type {
  CampusEnvironmentSample,
  CampusSideFountainId,
} from "./campus-environment";
import { createCampusBirdAudio } from "./campus-bird-audio";

type Texture = "water" | "wind" | "rustle" | "footsteps" | "conversation";
type Layer = {
  source: AudioBufferSourceNode;
  highPass: BiquadFilterNode;
  lowPass: BiquadFilterNode;
  gain: GainNode;
  pan: StereoPannerNode | null;
};

export type CampusAudioGraph = {
  context: AudioContext;
  output: GainNode;
  layers: Record<Texture, Layer>;
  sideFountains: Record<CampusSideFountainId, Layer>;
  birds: ReturnType<typeof createCampusBirdAudio>;
  release: () => void;
};

export function audioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  );
}

/** Hold the current value before a new ramp, including rapid mute/unmute. */
export function rampAudio(
  parameter: AudioParam,
  target: number,
  context: AudioContext,
  seconds = 0.3,
) {
  const now = context.currentTime;
  if (typeof parameter.cancelAndHoldAtTime === "function")
    parameter.cancelAndHoldAtTime(now);
  else {
    const current = parameter.value;
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(current, now);
  }
  parameter.linearRampToValueAtTime(target, now + seconds);
}

/**
 * Original stereo textures, not recordings. An overlapping tail is mixed into
 * the beginning at equal power, so every loop joins continuous audio without a
 * silent notch. Different lengths and seeds keep the layers independent. Side
 * fountains use mono textures so each panner locates one physical basin.
 */
function makeTexture(
  context: AudioContext,
  kind: Texture,
  variant = 0,
): AudioBuffer {
  const visitor = kind === "footsteps" || kind === "conversation";
  const rate = kind === "wind" || visitor ? 22050 : 32000;
  const seconds = kind === "water"
    ? variant === 1 ? 17 : variant === 2 ? 23 : 19
    : kind === "wind" ? 17 : kind === "footsteps" ? 11 : kind === "conversation" ? 23 : 13;
  const length = rate * seconds;
  const overlap = Math.floor(rate * 0.65);
  const channels = variant > 0 || visitor ? 1 : 2;
  const buffer = context.createBuffer(channels, length, rate);
  let seed = ({ water: 1879, wind: 7919, rustle: 6521, footsteps: 4013, conversation: 9311 }[kind]) + variant * 3251;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let channel = 0; channel < channels; channel++) {
    const raw = new Float32Array(length + overlap);
    let low = 0;
    let medium = 0;
    let envelope = 0;
    let event = 0;
    let nextStep = Math.floor(rate * 0.4);
    let stepAge = rate;
    let phraseRemaining = 0;
    let phraseTarget = 0;
    for (let i = 0; i < raw.length; i++) {
      const white = random() * 2 - 1;
      low += (white - low) * 0.018;
      medium += (white - medium) * 0.19;
      if (kind === "wind") {
        // Smooth, broad air; no oscillators or pitched drone.
        raw[i] = low * 1.9 + medium * 0.08;
      } else if (kind === "water") {
        // Fine, irregular splash grains over continuous turbulent water.
        if (random() < 70 / rate) event = 0.3 + random() * 0.7;
        event *= 0.9982;
        envelope += (event - envelope) * 0.025;
        raw[i] = low * 0.6 + medium * 0.26 + white * (0.09 + envelope * 0.22);
      } else if (kind === "rustle") {
        // Tiny overlapping leaf movements, separated from the low air layer.
        if (random() < 10 / rate) event = 0.25 + random() * 0.75;
        event *= 0.99965;
        envelope += (event - envelope) * 0.003;
        raw[i] = (white - medium) * (0.02 + envelope * 0.18);
      } else if (kind === "footsteps") {
        // Unpitched heel/sole contact with a short cloth/stone scuff. Irregular
        // intervals and pauses avoid an audible metronome or marching crowd.
        if (i >= nextStep) {
          stepAge = 0;
          event = 0.42 + random() * 0.5;
          nextStep = i + Math.floor(rate * (0.48 + random() * 0.24 + (random() < 0.16 ? 0.8 : 0)));
        }
        const age = stepAge++ / rate;
        const heel = Math.min(1, age / 0.008) * Math.exp(-age * 42);
        const scuff = age > 0.025 ? Math.exp(-(age - 0.025) * 31) * 0.16 : 0;
        raw[i] = event * (low * heel * 2.2 + medium * (heel * 0.28 + scuff));
      } else {
        // Very distant, entirely unvoiced hubbub: filtered noise and irregular
        // breath-like phrases, without words, pitched voices or a tonal drone.
        if (--phraseRemaining <= 0) {
          phraseTarget = random() < 0.44 ? 0 : 0.12 + random() * 0.65;
          phraseRemaining = Math.floor(rate * (0.25 + random() * 1.8));
        }
        envelope += (phraseTarget - envelope) * 0.00015;
        raw[i] = (medium - low) * envelope * 0.48;
      }
    }
    const samples = buffer.getChannelData(channel);
    samples.set(raw.subarray(0, length));
    for (let i = 0; i < overlap; i++) {
      const angle = ((i / overlap) * Math.PI) / 2;
      samples[i] = raw[length + i] * Math.cos(angle) + raw[i] * Math.sin(angle);
    }
  }
  return buffer;
}

export function createCampusAudio(
  Context: typeof AudioContext,
): CampusAudioGraph {
  const context = new Context({ latencyHint: "playback" });
  const output = context.createGain();
  output.gain.value = 0;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -16;
  limiter.knee.value = 18;
  limiter.ratio.value = 3;
  limiter.attack.value = 0.03;
  limiter.release.value = 0.3;
  output.connect(limiter).connect(context.destination);
  const layers = {} as Record<Texture, Layer>;
  const sideFountains = {} as Record<CampusSideFountainId, Layer>;
  let birds: ReturnType<typeof createCampusBirdAudio> | undefined;
  const release = () => {
    birds?.release();
    for (const layer of [...Object.values(layers), ...Object.values(sideFountains)]) {
      try {
        layer.source.stop();
      } catch {
        /* Context may already be closed. */
      }
      layer.source.disconnect();
      layer.highPass.disconnect();
      layer.lowPass.disconnect();
      layer.gain.disconnect();
      layer.pan?.disconnect();
    }
    output.disconnect();
    limiter.disconnect();
    void context.close().catch(() => {});
  };
  try {
    birds = createCampusBirdAudio(context, output);
    const addLayer = (kind: Texture, variant = 0) => {
      const source = context.createBufferSource();
      source.buffer = makeTexture(context, kind, variant);
      source.loop = true;
      const highPass = context.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value =
        { water: 200, wind: 85, rustle: 1300, footsteps: 95, conversation: 280 }[kind];
      highPass.Q.value = 0.3;
      const lowPass = context.createBiquadFilter();
      lowPass.type = "lowpass";
      lowPass.frequency.value =
        { water: 2900, wind: 700, rustle: 6200, footsteps: 1200, conversation: 1250 }[kind];
      lowPass.Q.value = 0.35;
      const gain = context.createGain();
      gain.gain.value = 0;
      const pan =
        typeof context.createStereoPanner === "function"
          ? context.createStereoPanner()
          : null;
      if (pan)
        pan.pan.value = kind === "wind" ? -0.16 : kind === "rustle" ? 0.17 : 0;
      source.connect(highPass).connect(lowPass).connect(gain);
      if (pan) gain.connect(pan).connect(output);
      else gain.connect(output);
      return { source, highPass, lowPass, gain, pan };
    };
    for (const kind of ["water", "wind", "rustle", "footsteps", "conversation"] as const) {
      layers[kind] = addLayer(kind);
      layers[kind].source.start();
    }
    for (const [index, id] of (["left", "right"] as const).entries()) {
      sideFountains[id] = addLayer("water", index + 1);
      sideFountains[id].source.start();
    }
    return { context, output, layers, sideFountains, birds, release };
  } catch (error) {
    release();
    throw error;
  }
}

export function tuneCampusAudio(
  graph: CampusAudioGraph,
  sample: CampusEnvironmentSample,
) {
  const { context, layers, sideFountains } = graph;
  const presence = Math.max(0, Math.min(1, sample.waterPresence));
  const gust = Math.max(0, Math.min(1, sample.wind.gust));
  const strength = Math.max(0, Math.min(1, sample.wind.strength));
  const foliage = Math.max(0, Math.min(1, sample.foliagePresence ?? 0.3));
  const centralGain = 0.2 + presence * 0.85;
  const sideTargets = (["left", "right"] as const).map((id) => {
    const source = sample.sideFountains?.find((fountain) => fountain.id === id);
    const near = Math.max(0, Math.min(1, source?.presence ?? 0));
    return { id, source, near, gain: source ? 0.08 + near * 0.82 : 0 };
  });
  // Adding two grand fountains must not triple the water loudness. Preserve
  // their distance ratios within one gentle amplitude budget before limiting.
  const totalWater = centralGain + sideTargets.reduce((sum, source) => sum + source.gain, 0);
  const waterBalance = Math.min(1, 1.15 / totalWater);
  // Distant calls stay below even the quiet central fountain. One-shots share
  // the master volume, indoor fade, mute and hidden-page context suspension.
  rampAudio(graph.birds.gain.gain, centralGain * waterBalance * 0.09, context, 0.5);
  graph.birds.update();
  rampAudio(layers.water.gain.gain, centralGain * waterBalance, context, 0.4);
  // The fountain gains both level and detail as the camera approaches.
  rampAudio(
    layers.water.lowPass.frequency,
    1550 + presence * 4200,
    context,
    0.5,
  );
  if (layers.water.pan)
    rampAudio(
      layers.water.pan.pan,
      Math.max(-0.65, Math.min(0.65, sample.waterPan)),
      context,
      0.5,
    );
  for (const { id, source, near, gain } of sideTargets) {
    const layer = sideFountains[id];
    rampAudio(layer.gain.gain, gain * waterBalance, context, 0.4);
    rampAudio(layer.lowPass.frequency, 1300 + near * 4500 + gust * 100, context, 0.5);
    if (layer.pan)
      rampAudio(layer.pan.pan, Math.max(-0.82, Math.min(0.82, source?.pan ?? 0)), context, 0.5);
  }
  rampAudio(layers.wind.gain.gain, 0.18 + strength * 0.16, context, 0.35);
  rampAudio(layers.wind.lowPass.frequency, 520 + gust * 430, context, 0.4);
  rampAudio(
    layers.rustle.gain.gain,
    (0.05 + gust * 0.31 + strength * 0.08) * (0.45 + foliage * 1.1),
    context,
    0.3,
  );
  rampAudio(layers.rustle.lowPass.frequency, 1800 + foliage * 3000, context, 0.4);
  const visitorPresence = Math.max(0, Math.min(1, sample.visitors?.presence ?? 0));
  const visitorMotion = Math.max(0, Math.min(1, sample.visitors?.motion ?? 0));
  const visitorPan = Math.max(-0.75, Math.min(0.75, sample.visitors?.pan ?? 0));
  // Even the closest group remains beneath the fountain/garden bed. A stopped
  // or reduced-motion scene has no footfalls; conversational hush can remain.
  rampAudio(layers.footsteps.gain.gain, visitorPresence * visitorMotion * 0.085, context, 0.18);
  rampAudio(layers.conversation.gain.gain, visitorPresence * 0.045, context, 0.6);
  for (const kind of ["footsteps", "conversation"] as const)
    if (layers[kind].pan) rampAudio(layers[kind].pan!.pan, visitorPan, context, 0.45);
}
