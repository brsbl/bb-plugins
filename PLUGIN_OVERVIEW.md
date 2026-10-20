## What you get

bb's new-thread page becomes a Windows XP-style desktop for your agents. Threads live in folders on the desktop and open as draggable Instant Message windows, a taskbar floats at the bottom with a Start menu, and the page itself is the wallpaper, so it pairs well with Ambient.

## Threads as buddies

Double-click a thread to open it as an Instant Message window. bb's own chat and composer run inside it, written as AIM lines, and each thread's agent gets a stable retro screen name. A door opens when an agent starts a turn and closes when it finishes. The Buddy List docks beside each window with every thread in the same project, working and waiting threads first. When a thread starts waiting on you, a yellow balloon pops up from the clock.

## Folders that are your sidebar

Desktop folders mirror the sidebar's sections, projects or machines, and filing a thread into a folder is an ordinary bb section change. Desktop-only folders can hide their threads from the sidebar. Archived threads sit in the Recycle Bin: drag a thread onto it to archive, or drag it back out to restore.

## Programs

The Start menu opens Paint (all sixteen XP tools, with pictures saved where agents can see them), a Terminal on your machine, bb Explorer (a real in-app browser), Media Player (a visualizer for your microphone), note pads that stick to the screen edges, and Minesweeper, Solitaire, Pinball and the 3D Maze screen saver.

## For agents

Agents read and write note pads, look at your Paint pictures, and draw new ones for you to open in Paint. Send a note pad or picture to any thread as a mention. In a terminal, `bb desktop` manages folders.

## For plugin authors

Your plugin can open as a Desktop program: an XP window with a Start menu entry, a taskbar button and a Quick Launch pin. Copy one small helper and render it from an overlay slot; the `desktop-apps` skill walks through it. The opt-in contract is stable from Desktop 1.0, and when Desktop is off, nothing renders and your plugin behaves as before.

## Requirements

Desktop shows on desktop-sized screens; on a phone, the sidebar button opens its settings. bb Explorer needs the bb desktop app. Runs entirely inside bb, with no external service or account.
