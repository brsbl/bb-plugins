# bb plugins

Personal bb plugins I use for product design work, kept together with the few build and repository tools they share. [![CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml)

[bb](https://getbb.app) is an agentic IDE for running coding agents across projects, threads, and environments. Its plugins can add UI, commands, skills, and server capabilities; this repository is where I build and maintain mine.

## Plugins

Each plugin has its own workspace under `plugins/` and a short README with the story behind it.

### Design Doctrine

Turns recurring product-design feedback into a searchable rule library that agents can apply while designing, building, and critiquing. Its maintenance workflow keeps the rules grounded in real review evidence.

![Design Doctrine's searchable rule library open in bb](plugins/design-doctrine/docs/screenshot.png)

[Source](plugins/design-doctrine) · [README](plugins/design-doctrine/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/design-doctrine --yes`

### Digests

Delivers private briefings as threads with numbered priorities, review buttons, and collapsed routine details. Add or edit a prompt-based digest under the site it reads in Settings. Connections reuse existing bb Browser sign-ins; Reading remembers summarized newsletters without marking them read. Other threads can publish their own issues.

![A Digests issue with numbered priorities and review buttons](https://github.com/user-attachments/assets/6d6f4f82-9f51-475a-b5e7-356a1e43459f)

[Source](plugins/digests) · [README](plugins/digests/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/digests --yes`

### FPL Draft

Follow your Fantasy Premier League Draft league’s matches and standings, compare waiver options, and bring the current view into an agent conversation with a context pill.

![FPL Draft waiver suggestion with expanded player comparison](https://github.com/user-attachments/assets/ea04832a-1a7f-4fdc-bcf7-66b85b951611)

[Source](plugins/fpl-draft) · [README](plugins/fpl-draft/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/fpl-draft --yes`

### GitHub Activity

Brings incoming comments and mentions from GitHub pull requests and issues you authored into one searchable, filterable triage view, with open and resolved activity kept together.

![GitHub Activity showing searchable filters and incoming pull-request and issue activity](plugins/github-notifications/docs/screenshot.png)

[Source](plugins/github-notifications) · [README](plugins/github-notifications/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/github-notifications --yes`

### Prompt Improver

Rewrites a rough bb composer draft into a clearer, context-complete prompt for review before you send it. The rewrite can be cancelled or undone without leaving the composer.

![Prompt Improver working on a composer draft](plugins/improve-prompt/docs/screenshot-running.png)

![Prompt Improver returning the revised draft for review](plugins/improve-prompt/docs/screenshot-result.png)

[Source](plugins/improve-prompt) · [README](plugins/improve-prompt/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes`

### Thread Hover Cards

Shows a thread's live status, latest agent update, execution context, repository, and pull request without leaving the sidebar. Collapsed sections get a compact summary of their thread count and attention state.

![A thread hover card showing live worker and repository context](plugins/thread-hover-cards/docs/screenshot.png)

![A collapsed section hover card summarizing its scope, activity, and attention state](plugins/thread-hover-cards/docs/screenshot-section.png)

[Source](plugins/thread-hover-cards) · [README](plugins/thread-hover-cards/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-hover-cards --yes`

### Thread Organizer

Organizes work into configurable workflow sections that agents follow, and keeps unread idle threads in Inbox. Sections can opt out of Inbox so their unread threads stay in place. Each section can carry an entry prompt that every arriving thread receives, so a review section can start a review and a testing section can ask for evidence.

![Thread Organizer showing the current development-phase sections in bb's sidebar](plugins/thread-organizer/docs/screenshot.png)

![Thread Organizer workflow settings](https://github.com/user-attachments/assets/4dba26ce-4033-4f4a-929d-98c630e72e57)

[Source](plugins/thread-organizer) · [README](plugins/thread-organizer/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/thread-organizer --yes`

### Context Katamari

Shows how full each thread's context window is as a Katamari Damacy-style ball in a floating window. The ball grows as context fills, pops when the thread compacts, and rolls only while the thread is working.

![Context Katamari rolling in its floating window](plugins/context-katamari/docs/screenshot.png)

[Source](plugins/context-katamari) · [README](plugins/context-katamari/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/context-katamari --yes`

### Inline Action Cards

Edit email replies and approve decisions inside agent messages. Review one item or a group in a table, and track waiting choices and results across threads in the Action log.

![Minimal cards](https://github.com/user-attachments/assets/692e0678-252d-47cf-8e1f-01e2b5c3fa7e)

![Action table and results](https://github.com/user-attachments/assets/ec63ecfe-86ad-4a46-8f6e-06a72e8923f0)

![Mixed table with one reply expanded](https://github.com/user-attachments/assets/4eef8810-5a99-40af-8fa4-974d25f6937f)

[Source](plugins/inline-action-cards) · [README](plugins/inline-action-cards/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/inline-action-cards --yes`

### Mesh Gradient

Creates, edits, saves, and shares reusable mesh gradients from a visual studio beside a thread. Users can hand an exact saved gradient to the current agent, while agents can generate gradients, inspect the shared library, and apply saved designs through the same plugin.

![Mesh Gradient's visual editor open beside a bb thread](plugins/mesh-gradient/docs/screenshot.png)

[Source](plugins/mesh-gradient) · [README](plugins/mesh-gradient/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/mesh-gradient --yes`

### Emoji Picker

Type `:` in a composer to open the picker, then choose an emoji to replace the colon. Search by name or shortcode, browse categories, and keep recent choices and a preferred skin tone close at hand.

![Emoji picker with category browsing and skin tone selection](https://github.com/user-attachments/assets/a74d890d-9ad9-46e5-a7a0-2995b386e054)

[Source](plugins/emoji-picker) · [README](plugins/emoji-picker/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/emoji-picker --yes`

### Endless

Frank Ocean's *Endless* as a bb palette — achromatic, grained, squared. Ten years to the day.

![The Endless palette in bb](plugins/endless/docs/screenshot.png)

[Source](plugins/endless) · [README](plugins/endless/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/endless --yes`

### Theme Preview

A skeleton of the bb app in every configuration — sidebar, splits, panels, overlays, real thread timelines and controls — drawn from the active theme's tokens, so a palette can be judged before it ships.

![Theme Preview in bb](plugins/theme-preview/docs/screenshot.png)

[Source](plugins/theme-preview) · [README](plugins/theme-preview/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/theme-preview --yes`

### Color Swatches

Renders an inline swatch beside every color literal in a thread — hex, `rgb()`, `hsl()`, `oklch()` and friends — the way an editor decorates code.

![Color Swatches in bb](plugins/color-swatches/docs/screenshot.png)

[Source](plugins/color-swatches) · [README](plugins/color-swatches/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/color-swatches --yes`

### Compact Links

Turns website URLs into compact favicon pills in the composer, sent messages and agent replies. Click a link to open it using your bb browser preference.

![SaaS and localhost links in drafts and conversations](https://github.com/user-attachments/assets/50b2bbde-30f6-4ac2-9060-a92d04a6bc07)

[Source](plugins/url-pills) · [README](plugins/url-pills/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/url-pills --yes`

### Open in Moss

Makes local Markdown links in bb open directly in Moss, with bb's viewer kept as the fallback.

![A Markdown file link from bb open in Moss](plugins/open-in-moss/docs/screenshot.png)

[Source](plugins/open-in-moss) · [README](plugins/open-in-moss/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/open-in-moss --yes`

### Moss Viewer

Reads and edits Moss notes in a bb panel the way Moss does: tabs, tables, wiki links, post embeds, charts, live HTML blocks, comments, and note-local images and video. Notes in ~/Moss/Notes open in Moss's own editor and save to their files on the Mac that holds them; other Moss notes open read-only.

![A Moss note with a wiki link pill and an embedded X post in bb's panel](https://github.com/user-attachments/assets/1f0ba527-c96d-4f11-9083-a2780231f7ef)

![A note-local video playing inside a Moss note in bb's panel](https://github.com/user-attachments/assets/79ebbff9-b01a-4922-a5d2-b87faec47a2c)

![A Moss note edited in Moss's own editor in bb's panel, with the header showing Saved](https://github.com/user-attachments/assets/37538150-e509-4a06-a261-7bb89c56db57)

![A new comment thread open beside a Moss note in the editor](https://github.com/user-attachments/assets/43b636a2-4e1f-4381-a100-ff85d6d3e87e)

[Source](plugins/moss-viewer) · [README](plugins/moss-viewer/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/moss-viewer --yes`

### Saved Places

Your saved places on a map that gets clearer as you zoom, with lists, notes, walking distance between saves, and an Ask agent button that hands the current view to a new thread. It now lives in its own template repository, [brsbl/saved-places](https://github.com/brsbl/saved-places), so you can make a copy with your own Google Maps saves.

Install: `bb plugin install git:https://github.com/brsbl/saved-places.git --yes`

### Plugin Finder

Find installed and Community plugins with `#plugin` or `@plugin` or let your agent search through the CLI, with full overviews and screenshot links.

![Plugin mentions in bb](plugins/at-plugin/docs/screenshot.png)

[Source](plugins/at-plugin) · [README](plugins/at-plugin/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/at-plugin --yes`

### Timeline Comments

Attaches durable discussion threads to selected timeline text. Users and agents can reply, edit, resolve or reopen comments, review them together, and add open feedback to the composer for follow-up.

![Timeline Comments adding a comment from bb's text-selection menu](plugins/timeline-comments/docs/selection-action.png)

![An anchored Timeline Comments pill with comment actions and its reply composer](plugins/timeline-comments/docs/screenshot.png)

![Timeline Comments copying an open comment into bb's composer for agent follow-up](plugins/timeline-comments/docs/send-to-agent.png)

![Timeline Comments List showing an open comment in bb's right panel](plugins/timeline-comments/docs/comments-panel.png)

[Source](plugins/timeline-comments) · [README](plugins/timeline-comments/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/timeline-comments --yes`

### Desktop

Turns bb's new-thread page into a Windows XP desktop for your agents. Folders mirror your sidebar, threads open as instant-message windows beside a Buddy List of their project, and a taskbar and Start menu launch XP programs and games, including a real terminal and in-app browser.

![Desktop with a thread open as an Instant Message window between its project's Buddy List and its Buddy Info](plugins/desktop/docs/screenshot.png)

![The Start menu opened from the bb button, listing bb Explorer, Terminal, Paint, and the games](plugins/desktop/docs/start-menu.png)

[Source](plugins/desktop) · [README](plugins/desktop/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/desktop --yes`

### Ambient

Paints a living generative background behind bb that reacts to your agents: working threads drift through it as lights, threads waiting on you pulse, and finished turns ripple outward. Tune any scene with its own sliders and palette, or ask an agent to write a new one.

![Ambient's Tide scene behind bb with two working agents as lights and the Ambient controls open in the sidebar](plugins/ambient/docs/screenshot.png)

Contour draws a calm night map with muted gold lines and agent peaks.

[Source](plugins/ambient) · [README](plugins/ambient/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/ambient --yes`

Each `plugin/*` install ref is generated from `main` after CI passes. The separate refs are necessary because bb installs from the root of a git checkout.

## Develop

The root tooling handles the unglamorous shared work: finding plugin workspaces, building them, checking the repository, validating artifacts, and publishing install refs. Runtime code, tests, SDK declarations, and UI stay with the plugin that owns them.

```bash
npm ci
npm run check
npm run new:plugin -- --slug example --name "Example" --description "Adds an example capability."
```

To work on one plugin, install its workspace directly: `bb plugin install "path:$PWD/plugins/<slug>" --yes`.

See [contributor guidance](CONTRIBUTING.md), the [plugin catalog entry template](tooling/plugin-catalog-entry.md), and [repository tooling](tooling/README.md).

### Pinned Files

Keep local files within reach in each thread with persistent pins above the composer. Ask the agent to pin files from the composer's pin button or use the CLI, and open pins through bb's file links.

![Persistent thread file pins](https://github.com/user-attachments/assets/6e33e4f9-e0e5-4db6-892f-631bf0567b35)

![The pin button adds a Pin files pill to the composer](https://github.com/user-attachments/assets/4749c71d-891c-4581-817d-33bc93e678ca)

[Source](plugins/file-pins) · [README](plugins/file-pins/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/file-pins --yes`

### Coordinator Mode

Turn any thread into a coordinator that tracks your asks as items, starts sub-threads for them, and moves each item forward only on real evidence such as a merged PR or your approval. Coordinator rules decide what it may do alone, must ask about, or must never do.

![Coordinator panel set-up form with the Ship template](https://github.com/user-attachments/assets/9754ab68-1937-4849-bfd8-b2e57807481d)

![Coordinator tracker with a proposed item waiting in Needs you](https://github.com/user-attachments/assets/d51eaa0b-c084-4dd6-968f-6593a4481ff6)

[Source](plugins/coordinator-mode) · [README](plugins/coordinator-mode/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/coordinator-mode --yes`
