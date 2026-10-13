# Google Ads

Read campaign performance, search terms and responsive search ad copy. Prepare an Inline Decisions card for a change the user makes manually in Google Ads.

## Install

```sh
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/google-ads --yes
```

Install the current **Inline Decisions** plugin for `propose` (its `create` RPC is required). Reads work independently.

## Use

Open **Google Ads** in bb. Save a developer token, advertising customer ID, optional manager login ID, and Desktop app OAuth client ID/secret in plugin secret settings. Enable the Google Ads API for the OAuth project. Use a developer token approved for the target account; test-only tokens cannot read production accounts. Google offers the `adwords` scope rather than a read-only OAuth scope; the plugin restricts its own transport to account listing and GAQL search.

Agents request credentials using bb's `secrets` skill, import the resulting private dotenv file with `bb google-ads configure --env-file <absolute-path> --json`, then remove the temporary file. No credential values belong in chat or argv. **Connect Google Ads** opens Google consent; paste the resulting loopback address into the masked form. PKCE and a ten-minute, single-use state bind the sign-in. The refresh token stays in secret settings. Each bb server needs its own setup; installation and reads have no machine-specific paths.

```sh
bb google-ads status --json
bb google-ads accounts --json
bb google-ads campaigns --json
bb google-ads ad-groups --json
bb google-ads ads --json
bb google-ads conversion-actions --json
bb google-ads report --last-7-days --json
bb google-ads report --from 2026-01-01 --to 2026-01-07 --by ad --json
bb google-ads search-terms --last-7-days --json
```

Reports support campaign, ad-group, ad and keyword grouping. Dates are inclusive in the account time zone; last seven days excludes today. Currency accompanies each report, CTR is a ratio, and cost/average CPC are currency units. Select download-button conversion-action resource names in settings after inspecting `conversion-actions`. Until then conversions are unknown (`null`). Selected actions use `metrics.all_conversions` so secondary download actions count too; traffic and conversion queries are joined without duplicating spend. Attribution uses interaction dates and the account's configured windows; recent data can lag. Search terms exclude queries suppressed by Google.

All commands output JSON; use `--help` for filters and limits. A result's `truncated` flag means output was capped; use a higher `--limit` or narrower scope. Source pagination over 20,000 rows fails without partial metrics. Raw Google errors, tokens and report data are never logged or persisted by this plugin.

`bb google-ads propose <id> --proposal-stdin --json` accepts `title`, `what`, `whyNow`, `options` (2+ strings), `recommendation`, and `next`. It creates a full-context decision card and returns its directive. Approval records a decision; it does not change ads or authorize automated application.

## Develop

Remote CI runs `npm run check --workspace=bb-plugin-google-ads` equivalents. Tests use synthetic fixtures and the SDK host harness. For an isolated dev app, run `fake-google-server.ts` with a TypeScript runner and set `BB_GOOGLE_ADS_FAKE_URL=http://127.0.0.1:53684` on that fresh server. Only IPv4 loopback is accepted. Never use a production data directory or real credentials in that fixture.

API references: [GAQL search and pagination](https://developers.google.com/google-ads/api/rest/common/search), [conversion reporting](https://developers.google.com/google-ads/api/docs/conversions/reporting), [OAuth](https://developers.google.com/google-ads/api/docs/oauth/overview). API v25 is pinned in the read client.
