# Read Aloud

Read agent messages aloud with [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) text-to-speech that runs on your device.

![Read aloud playing an agent message, with the Stop control](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/read-aloud --yes
```

## Use

- Hover a message and press **Read aloud** (▶) in its action bar. Press it again, or **Stop** in the toast, to stop.
- Highlight text in an agent message and choose **Read aloud** to hear only the selection.
- Code blocks, URLs, and Markdown syntax are skipped so the reading sounds like prose.

Kokoro runs in a background worker in the browser you use bb from. Audio never leaves your device. The first reading downloads the model and caches it in the browser: about 330 MB with WebGPU or about 90 MB with the WASM fallback. The model and runtime come from Hugging Face and jsDelivr.

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| Voice | `af_heart` | Any Kokoro v1.0 English voice (`a*` American, `b*` British). |
| Speed | `1` | Playback rate: 0.75, 1, 1.25, 1.5, 1.75, or 2. |
| Engine | `auto` | `auto` uses WebGPU when available and otherwise WASM; `webgpu` falls back to WASM if it fails to load. |

```bash
bb plugin config read-aloud set voice bm_george
```

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-read-aloud
```
