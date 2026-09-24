# Read Aloud

Read agent messages aloud with [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) text-to-speech running on your bb server.

![Read aloud playing an agent message, with the speed and Stop controls](docs/screenshot.png)

![Read aloud playing at 1.5× on a phone-sized screen](docs/mobile.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/read-aloud --yes
```

## Use

- Press **Read aloud** (▶) in a message's action bar. Press it again, or **Stop** in the toast, to stop.
- Highlight text in an agent message and choose **Read aloud** to hear only the selection.
- Press the speed button in the toast to switch between **1×**, **1.5×**, and **2×**. Each device remembers its choice.
- Code blocks, URLs, and Markdown syntax are skipped so the reading sounds like prose.

Speech is synthesized on the bb server and streamed to whatever device you're using, including phones. Devices never download the model. The server synthesizes a short first phrase so audio starts within a couple of seconds, and fetches the rest ahead of playback.

## Server setup

The first time the plugin loads, it prepares Kokoro on the bb server, which takes a few minutes. The server then keeps the voice loaded, so readings start right away.

- **Runtime install:** `npm ci` installs the pinned runtime from `runtime/runtime-lock.json` into the plugin's data directory. That's about 700 MB, and it's reinstalled only when the lockfile changes.
- **Voices:** all 28 Kokoro voices come bundled in that runtime.
- **Model:** the fp32 weights (about 330 MB) are downloaded once from a pinned Hugging Face commit.
- **Memory:** synthesis runs in a separate, low-priority process that uses about 1 GB.

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| Voice | `af_heart` | Any Kokoro v1.0 English voice (`a*` American, `b*` British). |

```bash
bb plugin config read-aloud set voice bm_george
```

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-read-aloud
```
