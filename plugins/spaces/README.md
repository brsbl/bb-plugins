# Spaces

Group related threads from any project into a Space. Open any thread in it, and
the right panel's **Space** tab shows every member's state and latest output,
with quick ways to step into each one.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/spaces --yes
```

Install the matching Thread Organizer too, so a Space keeps its finished threads
instead of sending them to Agent Inbox.

## Use

- **Make a Space.** Open any thread in a section and choose **Space** from the
  right panel's **+** tab launcher, then **Make <section> a Space**. A thread in
  the loose Threads list or an inbox gets **New Space** instead. Thread
  Organizer inboxes (Agent Inbox, Handoff, plugin inboxes) can't be Spaces.
- **See the whole Space.** Every member gets the Space tab. Members are grouped
  as Needs you, Working, New output, and Idle, each with its latest output.
  Click a card to peek and reply without leaving, or use **Open** or **Open in
  split**. With a card focused, ↑ and ↓ move, Space peeks, Enter opens, and S
  opens in split.
- **Add threads.** **+** in the tab opens a picker across every project. It
  suggests threads handed off to or from a member and shows each thread's
  current section, because adding moves it. Dragging a thread onto the Space's
  sidebar heading works too. Subthreads stay with their parent.
- **Stay quiet.** A Space waits in the sidebar's **More** while nothing in it is
  new. When a member has new output, asks a question, or fails, the Space comes
  out into the sidebar. Once everything is read and you've moved to another
  thread, it goes back. Spaces only puts back a Space it brought out; if you
  move one yourself, it stays where you put it.
- **Coordinate when you want to.** Select members and **Tell** them one
  message, sent as you; running threads get it after their turn. Or @-mention
  the Space in any thread: the agent gets the member list and latest outputs for
  that turn. Nothing coordinates in the background.
- **Members know their Space.** Each member's session gets one short line
  naming its Space and `bb space status`, so "coordinate with my other content
  threads" works without a mention. Turn it off in Settings → Spaces.
- **Stop being a Space** keeps the section and its threads where they are.

```bash
bb space list
bb space status Content
bb space create "Content" --from-section Content
bb space add thr_abc thr_def --space Content
bb space remove thr_abc
bb space stop Content
```

Limits: bb shows sections only when the sidebar is organized by sections
(Custom), so Space headings don't appear in By project or By machine; the Space
tab still works. Moving Spaces in and out of More uses the sidebar's own saved
layout, which syncs across your devices. A Space currently comes out of More
expanded, and its heading has no Space icon; both need small bb changes.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-spaces
bb plugin install "path:$PWD/plugins/spaces" --yes
```
