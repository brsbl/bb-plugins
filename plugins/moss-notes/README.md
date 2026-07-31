# Moss Notes

Moss Notes keeps bb thread notes as ordinary folders in the user’s default Moss workspace. There is no bb storage layer or embedded editor.

![Moss Notes in bb](docs/screenshot.png)

Each thread gets:

```text
~/Moss/Notes/bb Threads/Active/<thread-id>/
```

Opening **Moss Notes** in a thread creates that thread’s folder. Nothing is created at plugin startup, and there is no existing-thread scan or backfill.

The same folder follows the thread through its lifecycle:

| Thread state | Folder |
| --- | --- |
| Active | `bb Threads/Active/<thread-id>/` |
| Archived | `bb Threads/Archived/<thread-id>/` |
| Deleted | `bb Threads/Deleted/<thread-id>/` |

Archive and deletion move the entire folder, including every note inside it. Lifecycle events never create folders for threads whose Moss Notes page has not been opened.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/moss-notes --yes
```

## Use

Open **Moss Notes** from a thread’s panel actions. Create and edit notes with Moss or directly on the filesystem; bb agents receive the current thread folder path in their instructions.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-moss-notes
bb plugin install "path:$PWD/plugins/moss-notes" --yes
```
