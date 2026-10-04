# Pull Requests

See pull requests across bb threads and continue the work in the right conversation.

![Compact sidebar and pull request Summary with status rail and linked thread](https://github.com/user-attachments/assets/f7e7b9bc-134b-4b4e-8999-7d1ccd7aca4e)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/pull-requests --yes
```

## Use

Open **Pull Requests** from plugin navigation. The sidebar combines pull requests linked to visible bb threads across projects and machines. Select one to inspect its Summary or read-only Changes, then open the linked thread to continue.

- The compact sidebar shows active PRs in one sorted list, with separate **Pinned** and **Merged and closed** sections. Titles stay on one line with update times at the end. Pin a PR to keep it nearby.
- The **…** menu contains **Author**, **Reviewer** (including requested teams), and **Sort by** dropdowns. “Me” means the GitHub account reading each PR. Filters and sorting cover loaded PRs; Load more expands that set.
- Paste a GitHub URL into search to open or link a PR. Manage links and the preferred thread in detail.
- Status icons distinguish GitHub checks and reviews from live thread activity. Hover, focus, or tap an icon for its meaning.

Cached PRs remain usable during refresh. Descriptions and diffs load when opened, with delayed placeholders for slower reads.

Each source machine needs the GitHub CLI authenticated for the repository. The page identifies its reader and freshness; offline machines and incomplete discovery stay visible. It reads GitHub and changes only local associations and preferences. It never starts an agent, submits a review, merges a PR, or marks threads read.

GitHub.com is supported. This is a view of thread-linked PRs, not an account-wide GitHub inbox. PRs from removed worktrees are retained after discovery; unobserved historical PRs may need explicit linking.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-pull-requests
bb plugin install "path:$PWD/plugins/pull-requests" --yes
```
