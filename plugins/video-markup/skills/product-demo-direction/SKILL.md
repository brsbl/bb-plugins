---
name: product-demo-direction
description: Make or revise product demo videos, animated product films, and promo clips with restrained camera direction, truthful software behavior, physical realism, and reviewable Video Markup versions.
---

# Product Demo Direction

Make the product legible, alive, and believable. These defaults come from brsbl directing ten versions of a 34-second bb film on a folding “iPhone Duo.” They are starting points grounded in that film, not universal specifications for every device or story.

## Work with Video Markup

1. Before revising, call `video_markup_versions` and `video_markup_list_notes` with the current `threadId`, `versionId`, and `actionable: true`. Follow `nextOffset` until all notes are read. Inspect the attached frame stills; use `video_markup_frame` for any note whose image is absent.
2. Split dictated feedback into separate items. Restate each as **problem + moment**. Fix the largest perceptual problem first. “Less” or “more” means a small step. Show a still for subjective tuning before a full render.
3. Keep source and each rendered version at durable, distinct paths. Never overwrite a registered file. Save source with the keeper; Video Markup references media in place and does not archive video files.
4. Whenever the user attaches a video, and whenever you share any video with the user, call `video_markup_present` with `threadId` and `file`. For a composer attachment, use the absolute file path supplied in the prompt and set `attachment: true`: bb cleans up that staged file, so Video Markup must preserve it on the thread's host. For a durable agent render, leave `attachment` false. Optional `demo` overrides the thread's current demo; the first video derives a demo from its filename. Versions are named by their video filenames and ordered automatically. `summary` is optional agent-side context. Supply `fps` only when the source has a known constant frame rate and ffprobe is unavailable. Video Markup probes actual frame timestamps when ffprobe is present, including variable frame rate footage.
5. State known rough spots before delivery. Emit the `video_markup_present` result's `::video-markup{version="…"}` directive once, on its own line, outside a code fence. Never share a video as a bare link or path. The present operation registers it if needed and requests the review panel in the visible thread; the inline player's **Review notes** action is the fallback if that thread is not open. Thirteen messages in the source collaboration were about finding or playing the video.
6. Update addressed notes with `video_markup_update_note_status`. Use `fixed` only after checking the correction. Respect user verdicts of `still wrong` or `regressed`. Only `open`, `still wrong`, and `regressed` carry into a newly registered version. Carried notes retain their original frame version, timestamp, shapes, still, and creation time: do not claim an old still shows the new render.

The user reviews in the **Video Markup** thread panel or by opening an `.mp4`, `.webm`, or `.mov` file. They pause, step with ←/→, draw a box, arrow, or zoom region, and save a frame note. Space toggles playback. Their **Add to prompt** action inserts a structured mention with version, timestamp, normalized shapes, text, and captured stills. Sending remains the user's action.

## Direction defaults and evidence

| Area | Direction | Settled values and evidence |
| --- | --- | --- |
| Zoom depth | Zoom only far enough to read the target, then stop. Stability beats emphasis. | Dictation **1.35×**, decision **1.6×**, release notes **1.4×**, folded composer **1.4×**. The user moved from “too dramatic” → “zoomed in a little bit more so you can read the text” → “zoom in a little less. It's a little jarring now… keep the camera more stable.” |
| Zoom motion | Ease in and out; hold once zoomed. | About **1.6 seconds** per move; hold at least **200 ms**, “so it doesn't feel so stark.” |
| Landscape and scrolling | Zoom less when horizontal; stay wide enough during scrolling to see the page move. | About **25% less** in landscape, settled during the folding-device film. |
| Liveness | Show loading, progress, thinking, typing, and the user's taps, scrolls, and clicks. | “have data update in the frames… so it's clear these are not just stills but running code” |
| Input semantics | Type character by character with human timing. Voice transcription arrives all at once after processing. Check real product source. | “if it's voice transcription, it's all at once after the audio processes. You can look at BB source code” |
| Consequence | Every sent message or action visibly lands. Hold on its consequence. | “after the message is sent in the thread, the timeline should update” |
| Framing | Keep controls fully in frame. No product UI floats outside the device. | “the composer is cut off”; “you had the visual bells show above the device” |
| Physical motion | Fold real geometry, not a scaled rectangle. Darkness starts at the hinge and fades glossily outward. The far edge retains color until closed. | **1.5 seconds** each way, black no more than about **74% opacity**, half gloss / matte. “the phone slides narrower, instead of actually folding”; “It just turns completely black. It should be more of a sort of glossy fade out” |
| References | When subjective tuning stalls, find reference photos, list missing cues, and fix the largest one. | Galaxy Z Fold 6/7 photos exposed missing thickness, camera angle (about **24° to the side, 9° down** at mid-fold), and shadows caused by geometry. |
| Audio | Use natural voice only where someone speaks. Add no ambient bed unless asked. | Kokoro **`af_heart`** was the keeper. “Let's get rid of the ambient noise. It sounds weird.” |
| Quality | “Apple-esque” means clarity and restraint. Choose reviewable delivery quality. | Final **1080p / 60 fps**, plus a **720p phone copy**. 3200×1800 frames consumed about **9 GB per render**. |
| Rendering | Use a deterministic `seek(t)` timeline. Stream frames into ffmpeg; wait two animation frames for paint before capture. Clean temporary frames as you go. Save source with the keeper. | About **20 one-frame caption glitches** came from capturing before paint. |
| Delivery | Register every version in Video Markup and post the inline player. State rough spots before sending. | **13 messages** concerned finding/playing the video, including “where is the video”, “won't play”, and “i'm on my phone”. |
| Reading feedback | Split dictated feedback by problem and moment; fix the largest perceptual issue first. Tune in small steps and show a still first. | “maybe the third to last interaction? second to last?” and “after you press the circle toggle radio thing” showed why timecodes and regions matter. A roughly 200-word dictated paragraph described the fold. |

Rejected in this collaboration: a flat black fold overlay, robotic system TTS, an ambient noise bed, over-zooming, maximum-resolution renders, and invented product UI made with image generation instead of real captures.

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
