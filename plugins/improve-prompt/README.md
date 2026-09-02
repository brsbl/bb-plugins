# Prompt Improver

Improve Prompt gives a rough bb composer draft one focused editing pass. It returns a clearer, context-complete request for you to review, without sending anything.

![Improve Prompt working on a draft in the bb composer](docs/screenshot-running.png)

![The improved prompt returned for review in the bb composer](docs/screenshot-result.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/improve-prompt --yes
```

## Use

Write as roughly as you like, then choose **Improve prompt**. The revised text comes back in place for review; attachments stay attached, and you can undo the change.

While the rewrite is running, the composer is locked to prevent conflicting edits, the draft uses Improve Prompt's own shimmer treatment, and the same action becomes an accessible cancellation control. Cancelling aborts the client operation and stops the helper request; successful replacement restores focus to the composer.

The behavior comes from the installed `prompt-shaper` skill; the stable plugin ID remains `prompt-shaper` for compatibility.

## How it works

The plugin sends only the current draft to a standalone hidden helper thread. The helper applies the `prompt-shaper` skill to rewrite the draft into one paste-ready prompt, and the result replaces the draft in place. When the prompt box targets Claude Fable 5.1, the hidden helper also uses the project's `fable-5-1-prompting` skill as target-model guidance, regardless of which model runs the helper. The helper may reuse the source thread's environment and execution settings, but it never reads or inherits that thread's transcript.

bb gives a personal skill in `~/.bb/skills/prompt-shaper/` precedence over this plugin's bundled default, so you can tune the rewriting guidance without forking the plugin.

The UI is registered through `app.composer.customize(...)` as the `improve` composer action. Its component uses the context-bound `useComposer()` and `useComposerView()` hooks, so thread, queued-message, side-chat, and new-thread drafts are handled by their mounted composer instance.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-prompt-shaper
bb plugin install "path:$PWD/plugins/improve-prompt" --yes
```
