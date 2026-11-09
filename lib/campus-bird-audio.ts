/** Short original, softly enveloped calls. No downloaded recordings, continuous
 * tone, looping soundtrack, or additional timer: the ambience tick schedules
 * sparse one-shots on the audio clock, which stops with its parent context. */
export function createCampusBirdAudio(context: AudioContext, output: AudioNode) {
  const gain = context.createGain();
  gain.gain.value = 0;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 3200;
  filter.Q.value = 0.35;
  const pan = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
  filter.connect(gain);
  if (pan) gain.connect(pan).connect(output);
  else gain.connect(output);
  const buffers = Array.from({ length: 4 }, (_, variant) => {
    const rate = 22050;
    const buffer = context.createBuffer(1, Math.ceil(rate * 0.85), rate);
    const samples = buffer.getChannelData(0);
    let phase = 0;
    for (let i = 0; i < samples.length; i++) {
      const t = i / rate;
      const syllable = Math.floor(t / 0.27);
      const local = t - syllable * 0.27;
      const duration = 0.14 + variant * 0.012;
      if (syllable > 1 + variant % 2 || local > duration) continue;
      const envelope = Math.pow(Math.sin(Math.PI * local / duration), 2);
      const frequency = 1950 + variant * 215 + Math.sin(local / duration * Math.PI) * 640 - local * 1700;
      phase += 2 * Math.PI * frequency / rate;
      samples[i] = envelope * (Math.sin(phase) + Math.sin(phase * 2) * 0.065) * 0.16;
    }
    return buffer;
  });
  const active = new Set<AudioBufferSourceNode>();
  let seed = 43891;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  let nextCall = context.currentTime + 9 + random() * 5;
  let calls = 0;
  let released = false;
  return {
    gain, pan,
    update() {
      if (released || context.currentTime < nextCall) return;
      const source = context.createBufferSource();
      source.buffer = buffers[Math.floor(random() * buffers.length)];
      source.playbackRate.value = 0.94 + random() * 0.12;
      if (pan) pan.pan.value = (random() - 0.5) * 1.1;
      source.connect(filter);
      active.add(source);
      source.onended = () => { source.disconnect(); active.delete(source); };
      source.start();
      calls++;
      nextCall = context.currentTime + 17 + random() * 19;
    },
    snapshot: () => ({ calls, active: active.size, nextCall, gain: gain.gain.value }),
    release() {
      released = true;
      for (const source of active) {
        source.onended = null;
        try { source.stop(); } catch { /* Already ended. */ }
        source.disconnect();
      }
      active.clear();
      filter.disconnect(); gain.disconnect(); pan?.disconnect();
    },
  };
}
