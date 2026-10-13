---
name: google-ads
description: Read Google Ads campaigns, weekly performance, search terms and RSA message assets; propose manual changes as Inline Decisions.
---

Use `bb google-ads` for account reads. Every command supports `--json` and defaults to JSON. Never use browser automation to change ads after a proposal is approved: this plugin's approval means brsbl makes the change herself.

## Connect once

Run `bb google-ads status --json`. Missing credentials go through the `secrets` skill, never chat or CLI values. Batch `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, and `GOOGLE_ADS_CUSTOMER_ID` into `bb secret request --write-env <absolute-private-path>`. Add `GOOGLE_ADS_LOGIN_CUSTOMER_ID` only when a manager login is needed. Import with `bb google-ads configure --env-file <same-path> --json`, then remove that temporary file without reading it. The values are saved in plugin secret settings. Open Google Ads in bb; the user signs in and pastes Google's redirect address into the connection form, never chat.

Use `accounts --json` for directly accessible accounts, `accounts --manager --json` for the configured manager's client hierarchy. Choose the advertising customer. `conversion-actions --json` lists resource names, names, primary/secondary status and click-through windows. Confirm which actions measure download-button clicks, then save their comma-separated full resource names in the Download-button conversion actions setting. Never guess by a name match. Until selected, conversions are null, not zero.

## Weekly read

```sh
bb google-ads report --last-7-days --json
bb google-ads report --last-7-days --by ad-group --json
bb google-ads report --last-7-days --by ad --json
bb google-ads report --last-7-days --by keyword --json
bb google-ads search-terms --last-7-days --json
bb google-ads ads --json
```

For the Monday experiment read, seven days means completed days in the account's time zone. For checkpoints, use inclusive `--from YYYY-MM-DD --to YYYY-MM-DD`. Filter with `--campaign-id`; check `truncated` and increase `--limit` (up to 1000), or narrow the report. Reads beyond 20,000 source rows fail instead of returning incomplete conversion joins. No arbitrary GAQL or mutation command exists.

Read currency, date range and selected conversion actions with the results. CTR is a ratio; average CPC and cost use the account currency; costMicros preserves Google's integer string. Conversions use `all_conversions` restricted to selected download-button actions, including secondary actions, on interaction dates. They are attributed clicks, not installs. Recent conversions can lag and search terms omit Google's suppressed queries. Record those limits in the learning log. Don't sum the different report levels together.

Apply `growth-experiments` and its search-ads reference: compare messages within the same ad group and dates; inspect headlines/descriptions and `pinnedField` in `ads`. Check rotation in `campaigns` and `ad-groups`. Read CTR alongside downloads per click and per currency unit. Keep the declared checkpoint, spend cap and decision rule; don't claim random assignment or an early winner.

## Propose a manual change

Use `bb google-ads propose <unique-id> --proposal-stdin --json` with JSON containing `title`, `what`, `whyNow`, `options` (at least two strings), `recommendation`, and `next`. Include exact target and proposed copy or negative keyword, dated evidence, tradeoffs and manual UI steps in the brief. Inline Decisions must be installed with its `create` RPC. Emit the returned directive once on its own line.

A click is a decision, never execution. Follow the Inline Decisions skill to record approval as “Approved for your manual change; account not changed,” then verify with a fresh read only after brsbl says she changed it. Never report “applied” from an approval. Keep account data and proposals inside private bb threads; public PRs, fixtures, screenshots and documentation contain synthetic examples only.
