# Pull Requests

See pull requests across bb threads and continue the work in the right conversation.

![Pull request Summary with status icons and linked thread](https://github.com/user-attachments/assets/a9197e22-5fdf-4342-957c-8f865d5d3d69)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/pull-requests --yes
```

## Use

Open **Pull Requests** from plugin navigation. The sidebar combines pull requests linked to visible bb threads across projects and machines. Select one to inspect its Summary or read-only Changes, then open the linked thread to continue.

- **Open**, **Needs attention**, and **History** narrow your bb work. Pin a PR to keep it nearby.
- **Link pull request** previews a GitHub URL before associating it with an existing thread. Manage links and the preferred thread in detail.
- Status icons distinguish GitHub checks and reviews from live thread activity. Hover, focus, or tap an icon for its meaning.

Each source machine needs the GitHub CLI authenticated for the repository. The page identifies its reader and freshness; offline machines and incomplete discovery stay visible. It reads GitHub and changes only local associations and preferences. It never starts an agent, submits a review, merges a PR, or marks threads read.

GitHub.com is supported. This is a view of thread-linked PRs, not an account-wide GitHub inbox. PRs from removed worktrees are retained after discovery; unobserved historical PRs may need explicit linking.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-pull-requests
bb plugin install "path:$PWD/plugins/pull-requests" --yes
```
