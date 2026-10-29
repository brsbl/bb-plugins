# Hover card data and prior art

Hover previews should answer whether a thread, pull request or issue needs attention before the user opens it. These cards share the order **type, title and state → key facts → author/agent and activity**. The small DOM renderer is vendored in both plugins, so either plugin still installs independently.

## Surface inventory

The source locations below identify the entry points; symbol names remain useful if line numbers move.

| Surface | Renderer | Data source |
| --- | --- | --- |
| Sidebar thread | `plugins/thread-hover-cards/app.tsx:870`, `renderSummary` | `server.ts:907`, `threadSummary`: thread, pending interactions, execution options, project/environment and latest assistant message. Deferred timing and PR RPCs retain their existing budgets. |
| Sidebar section | `plugins/thread-hover-cards/app.tsx:1156`, `renderSectionSummary` | `server.ts:1374`, `sectionSummary`: cached section directory and scoped sidebar thread list. |
| Pinned PR and issue | `plugins/file-pins/link-preview-card.tsx:34`, `LinkPreviewCard` | `server.ts:228`, preview RPC → `link-preview.ts:188`, `LinkPreviews` → `preview-providers.ts:72`, `PreviewProviders` → `github-preview.ts:76`. |
| Pinned web page, image, npm package, Stack Overflow question | Same `LinkPreviewCard` | Same bounded loader; HTML/Open Graph in `preview-metadata.ts`, raster validation, npm registry or Stack Exchange metadata in `preview-providers.ts`. |
| Pinned local file | `plugins/file-pins/app.tsx:260`, inline tooltip | Stored pin title, path and note. It has no remote preview and is unchanged. |
| Pinned PR icon | `plugins/file-pins/url-pin-icon.tsx:93`, `usePrState` | `pr-state.ts:46`, `fetchPrState`, plus live sidebar PR state. This updates the icon, not the hover details. |
| Message/composer URLs | `plugins/url-pills/decoration.ts:117`, `mountUrlPills` | URL/favicon decoration only; there is no PR/issue hover-card renderer. |
| Core header/sidebar PR status | `apps/app/src/components/pull-request/PullRequestStatusPill.tsx:27` in the bb repository | Core PR summary and `pull-request-display.ts`; the native title describes status, rather than rendering a rich hover card. |

Before this change, pinned PRs and issues both used generic page metadata, although only the PR pin had a lifecycle icon. Thread and section cards already had separate, useful data fetchers. All rich cards now retain those owners and use the same layout function. Local-file tooltips and core native titles remain their existing lightweight surfaces.

## External patterns

[GitHub autolink documentation](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls) documents preview popups for references. [GitHub profile reference](https://docs.github.com/en/account-and-profile/reference/profile-reference) documents user status in hovercards, including busy status. [Keyboard navigation](https://github.blog/changelog/2024-07-29-keyboard-navigation-improvements-for-hovercards/) supports opening with Alt+Up and dismissing with Escape.

Live GitHub samples inspected on October 21, 2026:

- [Issue preview](https://github.com/cli/cli/issues/10000): repository/date, title and number, closed-as-not-planned state, body excerpt, then labels. This sample did not show checks or assignees.
- [PR preview](https://github.com/cli/cli/pull/14782): repository/date, title and number, merged state, body excerpt and base/head branches. This sample did not show check or review details.
- [User preview](https://github.com/octocat): avatar, login/name, plan, location and follow action. User hovercards are prior art for identity placement; neither changed plugin adds a user hover type.

[Linear Peek](https://linear.app/docs/peek) surfaces description, assignee, status, priority, cycle, labels, estimate and created/updated dates. Its [original improved Peek changelog](https://linear.app/changelog/2019-09-23-improved-peek) describes reviewing details without opening an issue; a [later changelog](https://linear.app/changelog/2025-06-12-project-labels) explicitly adds wrapped issue labels. These support visible ownership, activity and labels rather than description alone. Exact fields depend on the product and available data; this implementation does not copy unsupported Linear fields.

## API choices and limits

The existing pinned-link loader fetches public resources without credentials. This change preserves that boundary: public GitHub REST issue/pull endpoints supply lifecycle, author, labels, assignees, comments, branches and update time. A PR makes one primary request, then three parallel requests for reviews, current-head check runs and combined commit statuses. An issue takes one request; an issue URL that names a PR takes one additional lookup.

An authenticated GraphQL probe with `statusCheckRollup`, `reviewDecision`, `mergeable` and `mergeStateStatus` took 0.67 seconds for the sampled public PR. GraphQL could supply the required-review decision, but requires authentication. This implementation instead shows submitted approvals, changes requested and outstanding review requests. **Approval counts are not a branch-protection decision. “No conflicts” does not mean permission to merge.** Private or denied resources show unavailable information; the preview does not borrow an agent's credentials.

[REST pull requests](https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request), [reviews](https://docs.github.com/en/rest/pulls/reviews#list-reviews-for-a-pull-request), [check runs](https://docs.github.com/en/rest/checks/runs#list-check-runs-for-a-git-reference), [combined statuses](https://docs.github.com/en/rest/commits/statuses#get-the-combined-status-for-a-specific-reference), and [issues](https://docs.github.com/en/rest/issues/issues#get-an-issue) define the fetched fields. The existing `file-pins/pr-state.ts` URL parser is reused. Check conclusion classification follows `plugins/pull-requests/github.ts`; importing that plugin would create an installation dependency.

Checks and review lists are bounded to 100. A truncated list or unknown check conclusion cannot produce a passing result. A failure in optional checks/reviews preserves the primary item with an unavailable field. Mergeability may remain unknown while GitHub computes it. Closed/merged state takes precedence over draft state. Raw body comments are omitted from the excerpt.

Structured GitHub facts stay fresh for 30 seconds on the server and 15 seconds in the browser. Existing coalescing, bounded concurrency, request/byte limits, last-good previews and retry backoff are retained. A GitHub rate limit pauses provider calls across pins. The existing 800 ms opening hold still caps the initial wait; loading and failure use the same card header. Thread interactions share the summary's deadline and cancellation signal. New RPC fields are optional for compatibility with older bundles.
