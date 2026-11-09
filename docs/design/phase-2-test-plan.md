# Phase 2 transition audit and regression plan

Scope: extend the six-pavilion campus into six immersive worlds, each with three source-grounded story moments. This plan was recorded before the Phase 2 interface was integrated. Existing tests remain unchanged until the new interaction contract stabilizes.

## Existing behavior worth preserving

- Hash links, browser Back/Forward, direct section entry and keyboard activation already work.
- The current pavilion click guard prevents a same-target raycast from clearing the settled state and hiding the reading panel permanently. Keep this guard in the new world flow.
- Camera movement cancels its previous requestAnimationFrame and begins from the current position. Unmount releases WebGL resources.
- The map's zoom belongs to the parent rather than the selected section, which permits restoration after leaving a world.
- The source reading route is server-rendered and remains usable without JavaScript.
- Storage is optional and guarded against denied access.

## Extension risks and intended controls

| Risk | Required behavior / evidence |
|---|---|
| A delayed campus arrival or world callback reveals the wrong section | Key arrival completion by the current selection and transition generation. Rapid section changes and Back to Map invalidate all older callbacks. |
| The same section ID is revisited while an older transition still exists | Use an explicit phase and transition token; a numeric `settled` section alone cannot distinguish visits. |
| Story camera and caption disagree | A single committed story index drives title, caption, summary and visual scene. Test all 18 source-backed moments. |
| Existing exact hash parsing rejects story links | Define one parser that accepts old section links and any new story identifier. Invalid IDs and indices resolve safely. Browser history restores content deliberately. |
| Map or world remount loses orientation or story progress | Keep parent-owned zoom and per-section story progress. Clamp persisted values to the actual story count; denied or corrupt storage must not block entry. |
| Pause accidentally prevents deliberate navigation | Pause stops environmental motion, not Next/Previous Story, Read Summary or Back to Map. No automatic story advancement is required. |
| A summary starts hidden or off-screen while an animation never settles | First story and all summaries remain available immediately in reduced-motion/static mode, including when WebGL initialization or context recovery fails. |
| Selecting a story remounts the scene and audio | Update one scene/graph where possible. Check resource cleanup across repeated enter/exit cycles. |
| Full-screen world traps users | Keep an obvious Back to Map control, normal keyboard order, visible focus and scrollable expanded text. Full-screen is a layout, not a forced browser fullscreen permission. |
| Audio starts unexpectedly or survives exit | Sound defaults off on every mounted world; no saved autoplay preference. Create an AudioContext only after a sound-button gesture. Close it on unmount. |
| A hidden tab resumes sound unexpectedly | Visibility loss fades/suspends sound and clears the sound choice; returning stays silent until another explicit sound gesture. |
| Pause/resume or rapid Sound toggles races an async AudioContext promise | Track an operation generation and latest enabled choice; stale completions cannot restore output. |
| The PDF does not name any festivals | Story labels must remain its three themes: light over darkness, truth over ego, love over separation. Do not imply named historical festivals or approved documentary footage. |

## First-section gate: Hindu Festivals

1. Verify the concept, three source-supported moments, asset list, entrance/exit continuity and scene-to-caption mapping before building all six worlds.
2. From the map, enter the correct doorway, then settle in the festival courtyard before the full title/caption arrives. Verify keyboard and pointer entry.
3. Compare all three story captions, expanded summaries, reflections and PDF page links with the one-page source and shared content object.
4. Next/Previous Story changes the visible moment and caption together. Pause freezes background motion while manual progression still works.
5. Read Summary supports normal scrolling, focus and a clear close action. Closing returns focus to its trigger without moving the story.
6. Sound remains off until activated. Every story is understandable without sound; synthesized ambience is identified as a design interpretation, with no invented narration or sacred instruments.
7. Back to Map restores prior zoom and selection focus. Re-entry offers the last story, with a clear first-story route.
8. Desktop, tablet and 390px mobile previews must show reachable controls, readable captions, no horizontal overflow and no caption/control collisions.

## Automated regression suite after integration

- Exactly six destinations with exact PDF section names and accessible keyboard controls.
- Full-screen world entry and exit, source-linked first caption, correct heading focus, no stale summary after interrupted arrival.
- All 18 story moments: previous/next boundaries, caption/summary/scene index agreement, section and story position labels.
- Pause/resume on the same story; intentional navigation remains usable while paused; no unsolicited progression.
- Expanded summary open/close, focus return, keyboard Escape if a dialog is used, readable content at 390px.
- Per-section resume, Back/Forward, direct section links and direct story links if supported. Invalid stored indices and denied storage remain safe.
- Sound off on first entry, no context before activation, Sound On/Off reflects the actual choice, pause gate, hidden-tab suspension and no spontaneous return audio, exit closes the context, remount defaults off.
- Reduced motion skips arrival and story travel; environmental animation stays stopped without blocking reading or manually enabled sound.
- Static scene selection and forced WebGL failure retain every story and summary.
- JavaScript-disabled `/read` includes all six sections and all 18 moments with native headings/links/disclosures.
- Rapid section plus story changes, same-target raycast, return during entry and repeated visits cannot hide controls or leave an intermediate state indefinitely.
- Production Chrome desktop 1440×1000, mobile 390×844 and tablet 834×1194: no horizontal overflow, content/control geometry checks, no page errors.
- Axe WCAG A/AA scans on arrival, map, an active world, expanded summary, static fallback and complete reading route. Automated scans supplement visual and keyboard inspection.

## Sound hook contract

`useAmbientSound(sectionId, paused)` returns `{ enabled, available, toggle, error }`. Call `toggle` directly from the sound button. `enabled` represents the visitor's choice; `paused` temporarily mutes without changing that choice. Releasing pause only resumes an already-enabled graph. Visibility loss clears the choice, so foreground return does not play automatically. Section changes retune the same graph. Unmount stops/disconnects all nodes and closes the AudioContext.

The graph synthesizes a very quiet filtered noise texture. It uses no recorded exhibition media, spoken narration, religious sound or network request. Frequency changes alter the air/water-like atmosphere without claiming that an invented sound belongs to a tradition.

Implementation references checked for Phase 2:

- [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): user control, autoplay restrictions and generated buffers.
- [MDN AudioContext.resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume): asynchronous resumption and rejected closed-context promises.
- [MDN AudioContext.close](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/close): release both context resources and node references.
- [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API): respond to document visibility changes.
- [MDN AudioParam.cancelAndHoldAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime): limited browser availability requires a fallback when interrupting a fade.

## Evidence limits

Do not equate desktop Chrome emulation with physical iPhone/iPad GPU, touch or speaker testing. Do not claim full screen-reader or WCAG certification from axe. Record actual draw calls, triangles and deferred asset size separately from budget targets. Actual exhibition media and full source panels have not been supplied.
