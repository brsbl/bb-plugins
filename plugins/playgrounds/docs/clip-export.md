# Local clip export (R3)

Use **Path B**, the standalone Chrome replay. The agent runs `scripts/clip.mjs <id> --out clip.mp4`; it reads the card through `bb playgrounds clip-source`, then drives the existing `scripts/drive.mjs`. This keeps the renderer on the invoking machine (including remote enrolled hosts), rather than launching Chrome inside bb's server CLI handler.

## Why not in-frame recording?

- [`app.tsx`](../app.tsx), `HtmlPlayground`: the card is a separate iframe with `sandbox="allow-scripts"`; bb controls it with `postMessage`, not DOM access.
- [`widget.ts`](../widget.ts), `FRAME_HEADERS`: the response independently enforces `sandbox allow-scripts`, no network connections, inline scripts/styles, and restricted media. [`server.ts`](../server.ts) serves this document on `/frame`.
- bb core at `4363ba27d6f942d6b42ae61c8f85800e756b9085` uses the same opaque-origin model in [`IframeFilePreview`](https://github.com/get-bb/bb/blob/4363ba27d6f942d6b42ae61c8f85800e756b9085/apps/app/src/components/secondary-panel/FilePreview.tsx#L1250) and its [raw-file CSP](https://github.com/get-bb/bb/blob/4363ba27d6f942d6b42ae61c8f85800e756b9085/apps/server/src/services/hosts/raw-file-headers.ts#L3). This is a related core surface; Playgrounds owns its own iframe.
- Inference from those contracts and the [screen-capture standard](https://w3c.github.io/mediacapture-screen-share/): a generic automatic DOM/SVG card recorder cannot use `getDisplayMedia` as one agent action. Display capture requires transient user activation and a fresh user-chosen surface. It also lacks an exposed display-capture permission in this iframe. Canvas-only `captureStream()` is possible without changing the CSP, but [element capture](https://www.w3.org/TR/mediacapture-fromelement/) covers canvas/video, not the arbitrary HTML/SVG used by these cards. MediaRecorder encodes a stream; it does not create one from DOM.

No iframe sandbox or CSP change is part of Path B. The exported document receives the same CSP in a private loopback server; CDP additionally denies external requests. The browser has a disposable profile, and the server exposes only the current document and end frame, not a directory.

## Entry and replay

The Playgrounds skill's **Make a clip** section owns the agent workflow. `clip.mjs` is shipped as plain Node ESM with the Anatomy driver, so no project checkout, npm install or server-side browser is required. The input can instead be `--file figure.html --prompt "the original prompt"` for a standalone example.

The agent supplies its own action sequence or an explicitly recorded input sequence. `do` calls the actual card bridge, with the same action name and JSON argument array as the live card. Pointer and keyboard inputs use Chrome DevTools input events. A replay starts from the exported current saved state; use an initial reset/set action for another baseline. No automatic recording of earlier user history is claimed.

Output is silent H.264 High, yuv420p, closed GOP, square pixels, 30 fps, with a front-loaded MP4 `moov` atom. The last three seconds show the original prompt and **Made with bb · getbb.app**; Anatomy adds **Anatomy by Ryan (@wheresryan22)**. Prompt/credit text is at least 32 CSS pixels at 720 pixels wide. A prompt that does not fit fails instead of shrinking or truncating it. Capture holds frames when the host cannot supply a fresh image at every deadline; it preserves elapsed time, rather than speeding up the figure.

The optional GIF uses at most 10 fps and 350 frames. Its encoded bytes are parsed to check dimensions, frame count, 15 MB size and X's 300-million-pixel budget. Oversized GIFs fail visibly. The MP4, optional GIF, end-frame PNG and a machine-readable report are saved beside the requested output. Existing files are not overwritten. No output is uploaded.

## Encoder on a fresh Mac

Use an existing FFmpeg with libx264, else automatically fetch ffmpeg-static **b6.1.1**, verify the pinned SHA-256 of the compressed asset, and unpack it in a private user cache. This covers Mac arm64, Mac x64 and Linux x64. No Homebrew, global package installation or user action is needed for the encoder. Headless Chrome/Chromium is the renderer prerequisite; `CHROME_PATH` can select a provisioned Chrome for Testing. This is a native FFmpeg route, not an unverified WebCodecs/MediaRecorder fallback.

[Release assets and upstream build/source/license information](https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.1.1). The plugin does not redistribute the FFmpeg binary. The first encoder run downloads tooling only; it does not transmit the figure or its prompt. Offline use works once the tools are present.

## Social profile, checked 2026-10-19

[X's media guide](https://docs.x.com/x-api/media/quickstart/best-practices) recommends H.264 High, 30/60 fps and these three 720p shapes; requires YUV 4:2:0, progressive scan, square pixels and closed GOP. Its recommended bitrate is at least 5 Mbps; exported clips target 5 Mbps. Audio, if included, must be AAC LC mono/stereo. The same page recommends GIF ≤1280×1080, ≤350 frames, ≤300 million pixels and ≤15 MB. Its portrait recommendation conflicts with its older “Advanced” 1280×1024 dimension line; we follow its explicit 720×1280 recommendation and the R3 requirement.

[LinkedIn's native-video help](https://www.linkedin.com/help/linkedin/answer/a551346) accepts MP4, 10–60 fps, 256×144–4096×2304 and aspect ratios 1:2.4–2.4:1; all three exports fit. [Its ad-video specification](https://www.linkedin.com/help/lms/answer/a424737) explicitly names H.264 and AAC, but says less than 30 fps, so this 30 fps export targets organic posts, not guaranteed ad compliance. Neither cited page explicitly mandates faststart or explicitly confirms silent uploads; faststart is our interoperability choice, and silent acceptance still needs an actual upload check by the launch owner. This task uploads nothing.

## Evidence

The `Playgrounds clip acceptance` workflow produces an 18-second dial-indicator MP4 and GIF on Linux and Mac, exercising the same script and replay used by an agent. It checks actual GIF data and MP4 sample/atom layout, and retains videos/end frames as CI artifacts. The plugin's remote unit checks cover source access, original prompt handling, unchanged CSP and rejection of native cards. Final spike and isolated-bb results are recorded in the PR; pending checks are not acceptance evidence.
