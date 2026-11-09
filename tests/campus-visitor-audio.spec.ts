import { expect, test } from "@playwright/test";
import { createCampusAudio, tuneCampusAudio } from "../lib/campus-audio";
import { sampleCampusWind, type CampusEnvironmentSample } from "../lib/campus-environment";

class Parameter {
  value = 0;
  cancelAndHoldAtTime() {}
  linearRampToValueAtTime(value: number) { this.value = value; }
}
class AudioNodeStub {
  gain = new Parameter();
  frequency = new Parameter();
  Q = new Parameter();
  pan = new Parameter();
  threshold = new Parameter();
  knee = new Parameter();
  ratio = new Parameter();
  attack = new Parameter();
  release = new Parameter();
  buffer: { channels: Float32Array[] } | null = null;
  disconnected = false;
  stopped = false;
  connect(next: AudioNodeStub) { return next; }
  disconnect() { this.disconnected = true; }
  start() {}
  stop() { this.stopped = true; }
}
class AudioContextStub {
  currentTime = 0;
  destination = new AudioNodeStub();
  nodes: AudioNodeStub[] = [];
  closed = false;
  add() { const node = new AudioNodeStub(); this.nodes.push(node); return node; }
  createGain() { return this.add(); }
  createDynamicsCompressor() { return this.add(); }
  createBufferSource() { return this.add(); }
  createBiquadFilter() { return this.add(); }
  createStereoPanner() { return this.add(); }
  createBuffer(count: number, length: number) {
    const channels = Array.from({ length: count }, () => new Float32Array(length));
    return { channels, getChannelData: (index: number) => channels[index] };
  }
  async close() { this.closed = true; }
}
const sample = (visitors?: CampusEnvironmentSample["visitors"]): CampusEnvironmentSample => ({
  time: 1, wind: sampleCampusWind(1), waterPresence: 0.3, waterPan: 0,
  outdoor: 1, visitors,
});
const create = () => createCampusAudio(AudioContextStub as unknown as typeof AudioContext);

test("visitor sounds stay silent without crowd data and footsteps stop with motion", () => {
  const graph = create();
  expect(graph.output.gain.value).toBe(0);
  tuneCampusAudio(graph, sample());
  expect(graph.layers.footsteps.gain.gain.value).toBe(0);
  expect(graph.layers.conversation.gain.gain.value).toBe(0);
  tuneCampusAudio(graph, sample({ presence: 1, motion: 1, pan: 1 }));
  expect(graph.layers.footsteps.gain.gain.value).toBeGreaterThan(0);
  expect(graph.layers.footsteps.gain.gain.value + graph.layers.conversation.gain.gain.value)
    .toBeLessThan(graph.layers.water.gain.gain.value / 3);
  expect(graph.layers.footsteps.pan!.pan.value).toBeLessThanOrEqual(0.75);
  tuneCampusAudio(graph, sample({ presence: 1, motion: 0, pan: -1 }));
  expect(graph.layers.footsteps.gain.gain.value).toBe(0);
  expect(graph.layers.conversation.gain.gain.value).toBeGreaterThan(0);
  expect(graph.layers.conversation.pan!.pan.value).toBe(-0.75);
  graph.release();
});

test("visitor texture buffers are bounded and share the context cleanup", () => {
  const graph = create();
  for (const name of ["footsteps", "conversation"] as const) {
    const buffer = graph.layers[name].source.buffer as unknown as { channels: Float32Array[] };
    expect(buffer.channels).toHaveLength(1);
    const channel = buffer.channels[0];
    let energy = 0, peak = 0;
    for (const value of channel) {
      energy += value * value;
      peak = Math.max(peak, Math.abs(value));
    }
    expect(Number.isFinite(energy)).toBe(true);
    expect(energy).toBeGreaterThan(0);
    expect(peak).toBeLessThan(0.4);
  }
  const context = graph.context as unknown as AudioContextStub;
  graph.release();
  expect(context.closed).toBe(true);
  expect(context.nodes.every((node) => node.disconnected)).toBe(true);
  for (const layer of Object.values(graph.layers))
    expect((layer.source as unknown as AudioNodeStub).stopped).toBe(true);
});
