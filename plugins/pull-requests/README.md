# Pull Requests

See your GitHub pull requests and continue related work in bb.

![Compact sidebar and pull request Summary with status rail and linked thread](https://github.com/user-attachments/assets/1ed45e6e-163d-44e9-852a-7e818eef0c2c)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/pull-requests --yes
```

## Use

Open **Pull Requests** from plugin navigation. The sidebar queries GitHub for your open authored PRs, requests for your review (including team requests), and the latest 100 authored merged or closed PRs per account. It uses authenticated GitHub CLI accounts on connected machines and deduplicates PRs across sources. A bb thread is not required. Select one to inspect its Summary or read-only Changes, then open the linked thread to continue.

- The compact sidebar shows active PRs in one sorted list, with separate **Pinned** and **Merged and closed** sections. Titles stay on one line with update times at the end. Pin a PR to keep it nearby.
- The **…** menu contains **Author**, **Reviewer** (including requested teams), and **Sort by** dropdowns. “Me” means the GitHub account reading each PR. Filters and sorting cover loaded PRs; Load more expands that set.
- Paste a GitHub URL into search to open or link a PR. Manage links and the preferred thread in detail.
- Status icons distinguish GitHub checks and reviews from live thread activity. Hover, focus, or tap an icon for its meaning.

Cached PRs remain usable during refresh. Descriptions and diffs load when opened, with delayed placeholders for slower reads.

Each source machine needs the GitHub CLI authenticated for the repository. The page identifies its reader and freshness; offline machines and incomplete discovery stay visible. It reads GitHub and changes only local associations and preferences. It never starts an agent, submits a review, merges a PR, or marks threads read.

GitHub.com is supported. Cached results render before background GitHub sync. Open searches are bounded at GitHub’s 1,000-result limit per query; partial coverage and unavailable sources are reported. Previously discovered PRs, pins and thread links are retained. Merged and closed history stays in its own section. The explicit CLI archived-thread discovery option remains available for finding older thread associations.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-pull-requests
bb plugin install "path:$PWD/plugins/pull-requests" --yes
```
