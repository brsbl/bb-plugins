# Pull Requests

See your GitHub pull requests and continue related work in bb.

![Compact sidebar and pull request Summary with status rail and linked thread](https://github.com/user-attachments/assets/1ed45e6e-163d-44e9-852a-7e818eef0c2c)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/pull-requests --yes
```

## Use

Open **Pull Requests** from plugin navigation. The sidebar queries GitHub for your open authored PRs, requests for your review (including team requests), the latest 100 authored merged or closed PRs per account, and open PRs from every author in each bb project's GitHub repository. The Active view opens grouped by project; History contains merged and closed work. Use the filter menu to choose an author, reviewer, sort order, or grouping. It uses authenticated GitHub CLI accounts on connected machines and deduplicates PRs across sources. A bb thread is not required. Select one to inspect its Summary or read-only Changes, then open the linked thread to continue.

- Projects contain confirmed GitHub stacks or explicitly labeled branch dependencies, followed in prerequisite order. Unlinked PRs use repository groups. A stack keeps its full membership through search and filters; merged prerequisites remain visible as context.
- **Needs attention** shows groups containing an input request, requested review, agent error, or fresh GitHub failure. Collapsed groups summarize attention from every member. Pinning a member moves its whole group first within its project.
- Every PR has a readable status and reason. Live input requests win over GitHub freshness; stale or incomplete evidence is **Unknown**. **Ready for decision** means no known GitHub blocker, never user approval or QA sign-off.
- Filters cover the complete known registry. Missing members, ambiguous dependencies, cached relationships, and incomplete GitHub discovery are labeled explicitly.
- Paste a GitHub URL into search to open or link a PR. Manage links and the preferred thread in detail. Project ownership uses the preferred thread, then a unique verified origin, then an unambiguous repository mapping.
- Thread IDs and thread links in a PR description automatically associate accessible bb threads during sync. Multiple threads are supported; explicitly unlinked threads stay unlinked.

Cached PRs remain usable during refresh. Descriptions and diffs load when opened, with delayed placeholders for slower reads.

Each source machine needs the GitHub CLI authenticated for the repository. The page identifies its reader and freshness; offline machines and incomplete discovery stay visible. It reads GitHub and changes only local associations and preferences. It never starts an agent, submits a review, merges a PR, or marks threads read.

GitHub.com is supported. Cached results render before background GitHub sync. Open searches are bounded at GitHub’s 1,000-result limit per query; partial coverage and unavailable sources are reported. Previously discovered PRs, pins and thread links are retained. History is a separate view; search caps also mark coverage as partial. The explicit CLI archived-thread discovery option remains available for finding older thread associations.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-pull-requests
bb plugin install "path:$PWD/plugins/pull-requests" --yes
```
