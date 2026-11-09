# Garden ambience — signal and source record

The garden uses three **original procedural stereo textures**, generated locally
with the Web Audio API. They are not field recordings or recordings of a mandir,
and use no licensed or externally downloaded audio assets.

| Layer | Source and treatment | Loop |
| --- | --- | --- |
| Fountain | Continuous filtered turbulent noise with overlapping fine splash grains; presence, low-pass detail and stereo pan follow the camera | 19 seconds, 32 kHz stereo |
| Air through trees | Low-frequency coloured noise, high-pass filtered to avoid excessive rumble; gusts change level and brightness | 17 seconds, 22.05 kHz stereo |
| Leaves | Sparse overlapping noise envelopes, high-pass filtered above the air layer; the same garden gust increases rustling | 13 seconds, 32 kHz stereo |

A 650ms equal-power overlapping tail joins each loop to its start. This preserves
continuous audio rather than fading to silence at every boundary. Independent
durations prevent all layers repeating together. A gentle compressor contains
transients; the default volume is 48%. All parameter changes use held ramps.

No AudioContext exists until **Enable Ambience** is activated. Mute fades and
suspends the context, retaining the chosen volume. Entry fades exterior sound
and suspends once inside. Returning to the garden restores the previously
enabled ambience. A hidden tab stops the update timer, fades rapidly, and
suspends; returning resumes only an already-enabled soundscape. Unmount releases
every source/node and closes the context. Audio has its own low-frequency timer,
so reduced motion and the static map do not disable sound.

## Offline signal check

On 9 November 2026, installed Chrome rendered 40 seconds from the actual
`createCampusAudio` graph through `OfflineAudioContext`, at 32 kHz stereo.
The inspected scenario used default volume 48%, water presence 0.65, water pan
0.3, wind strength 0.45 and gust 0.35.

- Left/right RMS: **0.02856 / 0.03450** (linear full scale).
- Left/right peak: **0.12837 / 0.17751**; no clipping in this capture.
- Samples around 13, 17, 19, 26, 34 and 38 seconds retain energy at loop joins;
  their first-sample differences remain below each channel's ordinary maximum.
- Full numbers are in [environment-audio-metrics.json](environment-audio-metrics.json).
- A 12-second PCM preview from this same render is retained locally at
  `/tmp/hinduism-campus-preview/campus-ambience-preview.wav` for optional listening.

This establishes signal continuity and headroom for the tested mix, not the
acoustic quality or perceived loudness of a physical device. Live context
lifecycle, controls, camera response, visibility and reduced-motion behavior
are covered separately by the environmental browser checks.
