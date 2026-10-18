# Synthetic release fixtures

Use only an isolated bb with fresh data, no account, and no imported browser
profile. These fixtures contain no captured messages or account data. Do not
point a connection check at a real service or sign in for these captures.

## Brief thread

`brief.json` is a `digest_publish` payload with three invented sources on
`example.test`. `brief.md` is its search/fallback text. Seed a disabled definition
from `definition.json`, replacing `projectId` with an isolated fixture project's
ID. Pass it to `bb digest define --file <prepared-definition.json>` from an
fixture thread on that server (seed it without starting an agent). For a
publish-only fixture, change `connectionIds` to `[]` and `schedule` to `null`,
and set `execution: {projectId, hostId}` to the isolated fixture project and
computer before defining it. The project must have an available workspace.

Use `bb digest publish --digest fixture-brief --file <brief.md> --headline
"One reply needs you today" --lede "3 emails reviewed · 2 need no action"
--brief <the JSON-encoded brief field from brief.json> --key fixture-summary`.
This saves the summary and creates a delivery thread. Delivery normally needs
an agent turn; use a synthetic local provider, or seed its assistant message
with the returned `directive` in the isolated fixture database. Do not enable
or authenticate a real provider just for a capture. The normal Briefs message
renderer must render the returned directive.

Capture the summary with its priority, review button, count links, and collapsed
routine details. Expand the routine section only if needed to show the invented
sources clearly. Do not capture the fixture IDs or raw JSON.

## Settings/setup

Use `definition.json` with `connectionIds: ["gmail"]` and its disabled schedule.
The screenshot driver can stub only Briefs' `overview`,
`checkSettingsConnections`, and `executionOptions` RPC responses in the
isolated app: return that definition and a connection
`{id: "gmail", name: "Gmail", status: "signed-in", accountName: "Example account"}`;
return `organizerReady: true`, `actionCardsAvailable: false`, no run errors, and
empty execution choices. Do not run a connection check against Gmail. This is
fixture data for the real plugin settings component, not a real sign-in.

Open Settings → Plugins → Briefs. Show the named brief and weekday schedule;
open its edit form to show the prompt and **After reading: Keep unread** selector.
A second setup state may use an empty connection list and `organizerReady: false`
to show the import/setup guidance. Never click Import or authenticate a browser.

## Recovery coverage

`service.test.ts` runs the synthetic mixed-state mailbox and interrupted-run
cases in remote CI. `app.test.tsx` covers the warning for an unconfirmed unread
state. Neither test opens Gmail; agent-driven live Gmail UI compatibility is
outside these fixtures' coverage.
