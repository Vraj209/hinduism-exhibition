# Hinduism — a living exhibition

A Next.js 16 / React 19 digital exhibition with a real Three.js architectural campus, six source-backed destinations, a researched festival collection, and a complete server-rendered reading view.

## Run

```sh
npm install
npm run dev
```

Open **http://localhost:3000**. The local development server expects the `localhost` origin; use it instead of `127.0.0.1`.

```sh
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

With the development or production server already running:

```sh
npm run test:e2e
```

The Playwright configuration uses the locally installed Chrome channel. Set `PLAYWRIGHT_BASE_URL` to test another local server; see `playwright.config.ts`.

Walking controls, route boundaries and test evidence are recorded in [campus walking verification](docs/design/walking-verification.md).

## Experience

- The campus follows one entrance-to-mandir axis. Domes 1, 2 and 3 run from nearest to farthest on the left; domes 6, 5 and 4 face them on the right. A long fountain garden, continuous side walks and short inward approaches connect all six destinations.
- The full-screen opening stands at the entrance, 1.7 metres above the paving in the scene's calibrated scale, looking along the garden toward the Robbinsville Akshardham Mahamandir. The level perspective camera stays still until the visitor deliberately looks around.
- Drag horizontally, use the Look left / Look right buttons, or focus the scene and press the arrow keys. Home or Reset View restores the central axis. Campus Map opens the optional overhead view; the lightweight SVG map preserves the same arrangement.
- The opening title is simply “Hinduism.” Readable pavilion labels, a compact six-section selector and the numbered index allow free exploration. Phones frame the garden and mandir first, with horizontal looking to discover the wings.
- “Walk Around” starts at the entrance at the same 1.7-metre eye height. WASD/arrows walk; dragging looks around; Q/E turns, R/F looks up/down, and Home levels the view. Clicking or tapping paving follows a valid route. Taps and drags are separate gestures; keyboard controls ignore inputs, dialogs and the rest of the page.
- Walking uses a shared collision map for manual movement and A* routes, with clearance around basins, planting, trees, walls and stairs. Inner fountain promenades connect to the outer loop; narrow stone ramps lead to the six door landings. Select a dome to walk there, then choose “Enter Exhibition.” Stop and Go Directly remain available during automatic travel; reduced motion uses immediate travel.
- Exit Walk Mode, Campus Map and Return to Entrance remain available outdoors. Inside, Back to Campus restores the exact previous position and viewing direction, including after visiting another exhibition. Direct section navigation remains available alongside walking.
- Entering a dome suspends walking and looking. The interior becomes a dark HTML gallery with a faint floor, warm typography and well-exposed images. Outdoor ambience fades while preserving the visitor’s preference; the gallery itself is silent.
- Each of five domes contains an opening, three approved story moments and a closing. Festivals keeps its fourteen sourced celebrations between its opening and closing. The final display offers Next Exhibition, Return to Campus and Read Full Summary.
- The existing doorway approach leads into a quiet gallery. Desktop scrolling brings each display forward, holds it steady for reading and fades it past. Narrative position never advances on a timer; previous/next buttons provide an alternative to scrolling.
- Shareable story hashes remain stable: `/#section-hindu-festivals/story-2` opens Annakut. Section-only links open the introduction; `/closing` opens the takeaway. Scrolling replaces the current history entry, while exhibition changes preserve browser Back/Forward navigation.
- The previous campus camera, zoom and walking pose are restored on return. Visit markers use optional local storage; denied storage does not block the gallery.
- The gallery has no continuous render loop or automatically playing video. Only nearby desktop media is mounted; touch and reduced-motion layouts use normal vertical flow and native lazy image loading.
- Garden atmosphere uses a shared breeze for branches, leaves, flowers, landmark pennants, fountain ripples and rustling. Sparse leaves fall, settle and slide gently during gusts. “Pause motion” is independent of sound; reduced motion keeps the garden still.
- Campus visitors wear 28 distinct traditional outfits across saris, salwar kameez, anarkalis, kurtas, sherwanis, waistcoats and dhotis. Families, pairs and individuals follow grounded garden and doorway routes, pause to look around, and give the walking camera space. Shared skinned resources, three detail levels and an offscreen-only adaptive population budget reduce mobile work (16 visitors initially). Quiet visitor sound joins the existing opt-in ambience. See [visitor verification and limits](docs/design/campus-visitors-verification.md).
- Soft cloud layers drift with the shared wind, with restrained sunlight changes and matching cloud shadows on the actual architecture and garden. Two carved-stone fountains frame the entrance garden, with central plumes, inward jets, falling water and spray. The original five axial fountain groups remain. Extended side walks join the near crosswalk around both fountains.
- Small distant bird flocks alternate wing beats and glides on continuous, depth-tested routes. Evolving cloud detail and occasional quiet bird calls keep the sky active; mobile uses fewer birds and simpler clouds. Sky motion shares the garden pause, reduced-motion and hidden-page controls. See [sky animation verification](docs/design/sky-animation-verification.md).
- Each side fountain has a separate water source, distance falloff and stereo position through the existing ambience controls. Their combined water level is bounded; no sound starts automatically. Portrait framing includes both fountains at the same 1.7-metre eye height, with a diagonal field-of-view cap through square viewports.
- “Enable Ambience” starts original stereo fountain, air and leaf textures with mute and volume controls. Fountain presence and stereo position follow the camera; outdoor sound fades and suspends indoors, then returns to the visitor’s chosen level outside. Hidden tabs suspend audio and rendering. The interior remains silent; no narration or religious recording is introduced.
- The gallery works without WebGL. All twenty-nine story moments use locally optimized official BAPS photographs with source credits, including the fifteen moments in the other five domes. Portrait photographs are contained without cropping their subjects.
- `/read` contains every section and all twenty-nine story summaries in server-rendered HTML, usable without JavaScript or WebGL.
- Mobile, short windows and reduced-motion preferences present the same content as a simple vertical sequence. Back, previous/next controls and progress remain reachable outside the scrolling content and respect safe-area insets.

## Source boundaries

`docs/Takeaways for gutko.pdf` is the source for the original six section messages: one page, six takeaways, and three subdivisions within the final section. The six exact titles and source order are retained in `content/exhibition.ts`. The PDF is also served as `/exhibition-source.pdf`, with page links in both reading experiences.

The source supplies no floor plan, full exhibition panels, photographs, artifacts, named festivals, detailed stories, approved Hindi content, or 3D models. The surrounding campus is the exhibition owner’s design, with the axial arrangement specified in the later revision request. The referenced hand-drawn sketch was not available in this chat; the layout preview was checked against the written placement instructions, and comparison with the drawing remains pending.

The six approved exhibition domes retain their New Delhi Akshardham-inspired architecture and thematic carvings. The central landmark is a **photo-based reconstruction of the Robbinsville Akshardham Mahamandir**, informed by official front and oblique photographs and BAPS architectural information. Its overall proportions preserve the published 255-foot width, 345-foot length and 191-foot height. No verified authorized model or measured plans were available; tower placement, rear elevations, stair geometry and carving detail remain approximate. The exhibition grounds do not represent the actual Robbinsville campus, and the mandir is not a seventh section.

The gallery photographs document BAPS community life, rites, reflection, service, scripture, sacred spaces, spiritual guidance and festivals; source pages, original image URLs, subject descriptions and credits are recorded in `content/gallery-media.ts`. At the user’s request, Festivals now adds fourteen named celebrations researched from linked official BAPS sources. These additions are clearly separated from the supplied PDF and are not presented as a complete Hindu calendar. The remaining fifteen moments explore the original section phrases. The treatment of Sant — Guru and Satpurush is attributed to this exhibition's devotional perspective.

The public `/references` page records architectural sources, festival references, credits and asset status. Full audit and mapping are in `docs/design/baps-visual-audit.md` and `docs/design/asset-register.md`.

The approved pavilion family uses six domed exhibition buildings. Verified archival photographs of Delhi's Exhibition Hall 1 inform the stepped plinths, banded walls, sculpted pilasters and projecting eaves. The large dome proportions and six-building arrangement are original design decisions. Each pavilion has a source-based hero relief, related wall panels, and smaller motifs on the dome drum and entrance pillars; matching motifs continue inside. The entrance camera pauses briefly on the relief before passing through the centered doorway.

See the [current sky and side-fountain verification](docs/design/sky-side-fountains-verification.md), [preceding entrance hero verification](docs/design/hero-entrance-verification.md), [axial layout preview](docs/design/campus-layout-preview.md), [Robbinsville reconstruction references and limits](docs/design/robbinsville-mandir-reference.md), and [preceding campus layout verification](docs/design/campus-layout-verification.md). The [exterior reference and carving plan](docs/design/domed-pavilions-reference-plan.md), [thematic geometry plan](docs/design/thematic-relief-plan.md), and [domed pavilion verification](docs/design/domed-pavilions-verification.md) preserve the approved pavilion evidence. The [BAPS revision verification](docs/design/baps-verification.md) and [interior rendering evidence](docs/design/interior-baps-rendering.md) record the preceding visual revision. The [asset register](docs/design/asset-register.md) retains provenance across revisions.

## Project structure

| File                                                       | Responsibility                                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `content/exhibition.ts`                                    | Shared source-backed content, exact titles, source references                    |
| `lib/campus.ts`                                            | Axial campus coordinates, inward pavilion orientations and camera poses          |
| `lib/campus-navigation.ts` / `lib/campus-obstacles.ts`       | Shared walkable surfaces, collision clearance, A* routes and planting positions   |
| `lib/campus-walk-controller.ts` / `lib/campus-walk.ts`        | Opt-in keyboard/touch walking, route following, destination marker and state      |
| `lib/campus-landscape.ts`                                  | Garden, connected paths, trees, low fountains and animated water                 |
| `lib/campus-visitors.ts` / `lib/campus-crowd.ts`             | Visitor routes, cohorts, personal space, camera clearance and adaptive detail     |
| `lib/campus-visitor-models.ts` / `lib/campus-visitor-signs.ts` | Traditional clothing, shared rigs, grounded gait, breeze and exhibition plaques |
| `lib/robbinsville-mandir.ts`                               | Photo-based Robbinsville landmark with documented geometric limits               |
| `lib/domed-pavilion.ts`                                    | Preserved six-pavilion architecture and thematic exterior details                |
| `components/campus-scene.tsx`                              | Campus assembly, lighting, raycasting, projection, camera travel and GPU cleanup |
| `components/exhibition.tsx`                                | Campus navigation, browser history, preferences and fallback                     |
| `components/section-experience.tsx`                        | World interface, summaries, progress, transitions and static mode                |
| `components/world-scene.tsx`                               | Six 3D interiors, story dissolves, ambient light and GPU lifecycle               |
| `lib/world-architecture.ts`                                | Interior palettes and moment-specific lighting                                   |
| `lib/world-geometry.ts` / `lib/world-garden.ts`            | Shared batched interior geometry and garden architecture                         |
| `content/festivals.ts`                                     | Fourteen researched celebrations with official sources and tradition labels      |
| `lib/festival-world.ts`                                    | Individually authored festival object tableaux                                   |
| `content/stories.ts`                                       | Twenty-nine moments, individual source links and scene descriptions              |
| `components/use-ambient-sound.ts`                          | Gesture-gated synthesized sound and audio cleanup                                |
| `components/fallback-map.tsx` / `public/campus-layout.svg` | Lightweight overhead schematic and six matching selectable pin anchors           |
| `app/read/`                                                | Server-rendered reading route and native anchor navigation                       |
| `public/fonts/`                                            | Self-hosted Cormorant Garamond and DM Sans with SIL licenses                     |
| `docs/exhibition-source-outline.md`                        | PDF audit and six-section outline                                                |
| `docs/design/experience-plan.md`                           | Campus, six concepts, materials, interactions and asset budgets                  |
| `docs/design/verification.md`                              | Measured checks, budgets and limitations                                         |
| `tests/exhibition.spec.ts` / `tests/immersive.spec.ts`     | Campus, world, accessibility and fallback regression tests                       |
| `docs/design/phase-2-storyboard.md`                        | First-world storyboard, asset list and source mapping                            |
| `docs/design/phase-2-verification.md`                      | Phase 2 regression evidence and limitations                                      |

## Asset strategy

Architecture is generated from reusable, materially batched geometry: profiled pillars, scalloped arches, lattice, curved domes, raised plinths and layered cornices. Thematic reliefs use bevelled extrusions, sculpted solid forms, recessed fields and raised mouldings that cast real shadows. Stone grain is a tiny procedural texture. Garden motion is capped at 30 fps on desktop and 20 fps on mobile; foliage shadows refresh at 8/4 Hz. The environment stops when paused, reduced motion is preferred, the campus is out of view, a pavilion has been entered, or the document is hidden. Camera travel renders only during its transition. Fountain reflections use a single low-resolution capture of the actual architecture, with no recurring reflection pass. Mobile reduces foliage and particle counts, pixel ratio, shadow size and reflection resolution. Interior ambient movement remains capped at 24 fps, with a stable camera while reading. Three.js loads separately from the accessible interface. The SVG campus schematic and twenty-nine desktop/mobile poster pairs provide lightweight alternatives. The earlier rendered campus overview remains a historical asset and is no longer the active fallback. Mobile world images are rendered with a separate camera composition, not cropped from the desktop image.

See [environmental realism verification](docs/design/environmental-realism.md) and [original ambience signal/source evidence](docs/design/environment-audio-verification.md) for current behavior, measured limits and validation.

Fonts are local WOFF2 files (about 73 KB combined). All active story imagery consists of locally optimized, credited BAPS photographs. The original rendered illustrations remain stored for provenance; the gallery no longer uses them. Campus architecture is original geometry, and no documentary photographs or religious likenesses have been fabricated. Optional campus audio is synthesized locally; there are no external audio requests, analytics or remote fonts.
