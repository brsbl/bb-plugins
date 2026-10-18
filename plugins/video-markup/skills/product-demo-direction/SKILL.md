---
name: product-demo-direction
description: Make or revise product demo videos, animated product films, and promo clips with restrained camera direction, truthful software behavior, physical realism, and reviewable Video Markup versions.
---

# Product Demo Direction

Make the product legible, alive, and believable. Adapt camera, pacing, audio, and delivery choices to the product, intended audience, and requested style. Verify the product behavior before depicting it.

## Work with Video Markup

When the user attaches a video for review, present it immediately with `video_markup_present` and emit the returned inline player directive before analyzing it. Analyze the whole video only if the user asks, or after presenting when that analysis is needed to act on frame notes. Presentation must not wait for a full-video review.

1. Before revising, call `video_markup_versions` and `video_markup_list_notes` with the current `threadId`, `versionId`, and `actionable: true`. Follow `nextOffset` until all notes are read. Inspect the attached frame stills; use `video_markup_frame` for any note whose image is absent.
2. Split dictated feedback into separate items. Restate each as **problem + moment**. Fix the largest perceptual problem first. “Less” or “more” means a small step. Show a still for subjective tuning before a full render.
3. Keep source and each rendered version at durable, distinct paths. Never overwrite a registered file. Save source with the keeper; Video Markup references media in place and does not archive video files.
4. Whenever the user attaches a video, and whenever you share any video with the user, call `video_markup_present` with `threadId` and `file`. For a composer attachment, use the absolute file path supplied in the prompt and set `attachment: true`: bb cleans up that staged file, so Video Markup must preserve it on the thread's host. For a durable agent render, leave `attachment` false. Renders join the thread's current demo unless you pass `demo`; pass it whenever a render is not a revision of that demo. Attachments and the first video derive a demo from the filename. Versions are named by their video filenames and ordered automatically. `summary` is optional agent-side context. Supply `fps` only when the source has a known constant frame rate and ffprobe is unavailable. Video Markup probes actual frame timestamps when ffprobe is present, including variable frame rate footage.
5. State known rough spots before delivery. Emit the `video_markup_present` result's `::video-markup{version="…"}` directive once, on its own line, outside a code fence. Never share a video as a bare link or path. The present operation registers it if needed and requests the review panel in the visible thread; the inline player's **Review notes** action is the fallback if that thread is not open.
6. When you present a revision, leave the notes it addresses open and say what you changed for each. The user checks the new cut and marks each note fixed, still wrong, or regressed; a note you mark fixed drops out of their checklist before they have looked. Call `video_markup_update_note_status` only when the user asks you to set a status. Only `open`, `still wrong`, and `regressed` carry into a newly registered version, from any earlier version of the demo, using each note's most recent copy. Carried notes retain their original frame version, timestamp, shapes, still, and creation time: do not claim an old still shows the new render.

The user reviews in the **Video Markup** thread panel or by opening an `.mp4`, `.webm`, or `.mov` file. They pause, step with ←/→, draw a box, arrow, or zoom region, and save a frame note. Space toggles playback. Their **Add to prompt** action inserts a structured mention with version, timestamp, normalized shapes, text, and captured stills. Sending remains the user's action.

## Direction defaults

- **Camera:** Zoom only far enough to read the target. Ease into a stable hold, and keep enough context visible to follow scrolling. Tune movement to the viewport and text size.
- **Liveness:** Show actual loading, progress, typing, taps, and scrolling. Verify when input appears in the real product; do not invent transcription or response timing.
- **Consequences:** Let each action visibly complete. Hold on the resulting state long enough to understand it.
- **Framing:** Keep relevant controls fully in frame. If using a device frame, keep product UI inside its screen.
- **Physical motion:** Use geometry and references appropriate to the depicted device. Check thickness, hinges, lighting, and shadows before refining decorative effects.
- **References:** When subjective tuning stalls, compare reference images, identify missing cues, and fix the largest perceptual mismatch first.
- **Audio:** Add voice where the story calls for speech. Use an ambient bed only when requested; choose voice and sound based on the brief.
- **Quality:** Choose resolution, frame rate, and file size for the review device and delivery channel. Offer a smaller review copy when useful.
- **Rendering:** Use a deterministic timeline for generated animation. Wait for the browser to paint before capturing frames, stream frames to the encoder where possible, and clean temporary frames as you go.
- **Delivery:** Keep source with each retained render. Present every version through Video Markup and state known rough spots.
- **Feedback:** Split feedback by problem and moment. Make small adjustments for subjective changes and show a still before committing to a full render.

Use real product captures for software behavior. Avoid invented interfaces, excessive camera movement, and effects that obscure the action.

## Agent and CLI reference

Every operation takes `threadId`; CLI calls use the current thread or `--thread ID`. IDs come from Video Markup results. Never invent version or note IDs.

| Tool | CLI | Purpose |
| --- | --- | --- |
| `video_markup_present` | `bb video-markup present --file /absolute/demo-v10.mp4 --summary "Gentler camera"` | Register if needed, request the panel, and return the inline player directive. Use `--attachment` for a composer attachment. |
| `video_markup_register_version` | `bb video-markup register --file /absolute/demo-v10.mp4` | Register without presenting; optional `--demo` and `--summary`. |
| `video_markup_versions` | `bb video-markup versions` | Read demos and ordered versions; continue with `--offset`. |
| `video_markup_list_notes` | `bb video-markup notes --version VERSION --actionable` | Read unresolved notes; optional `--status "still wrong"`, `--demo`, `--offset`. |
| `video_markup_add_note` | `bb video-markup add-note --data '<JSON>'` | Save a frame note and captured JPEG, with the same validation as the UI. |
| `video_markup_update_note_status` | `bb video-markup status --note NOTE --status fixed` | Set `open`, `fixed`, `still wrong`, or `regressed`. |
| `video_markup_context` | `bb video-markup context --data '{"noteIds":["NOTE"]}'` | Prepare structured selected-note context; the UI inserts its mention into the composer. |
| `video_markup_frame` | `bb video-markup frame --note NOTE` | Get the still (native image from the tool, data URL from the CLI). |
| `video_markup_post_player` | `bb video-markup post --version VERSION` | Return the directive to post inline. Print the directive in the agent's reply. |

CLI output is JSON (`--json` is accepted). Registration accepts optional `--fps 60`. `add-note` JSON contains `versionId`, `timestamp` in seconds, `text`, `shapes`, and `still: {dataUrl, width, height}`. Each shape is `{kind: "box" | "arrow" | "zoom", x1, y1, x2, y2}` in normalized video coordinates (0–1, origin at top left). An arrow runs from point 1 to point 2. Box and zoom corners may be drawn in either direction. A captured JPEG data URL is limited to 350,000 characters. Select up to 12 actionable notes per prompt.

Install ffprobe on the video's host for automatic metadata and exact frame timestamps. Browser playback depends on supported codecs: use H.264 MP4 for the broadest phone/laptop compatibility. If ffprobe is missing, playback still works; stepping requires a supplied, known constant frame rate. Do not invent an FPS or silently claim variable-rate stepping is accurate without frame timestamps.
