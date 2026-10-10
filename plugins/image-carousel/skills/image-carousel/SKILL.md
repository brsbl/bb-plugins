---
name: image-carousel
description: Show screenshots in a bb thread as an inline carousel. Use for design research (how other products handle something, one product per slide) and for before/after comparisons of UI changes, instead of a long run of inline images or a screenshot table in chat.
---

# Image Carousel

A carousel shows one slide at a time with arrows on either side. Each slide has the image on top and a title, description, and optional source link below it.

- **research**: one image per slide. Use it to compare how other products handle a design problem. Give each slide the product or pattern as its title, say what it does well or badly, and link to where the screenshot came from.
- **before-after**: two images per slide, shown side by side and labeled Before and After. Use one slide per visible change. The title names the change; the description says what changed and why. Capture both images at the same size, crop, and state so the change is the only difference.

Only show real captures. Never present mockups or placeholders as research or as before/after evidence. Pull request bodies still need their own screenshots; a carousel is for the thread.

## Create

Run `create` from the thread whose machine has the images: paths are read only from that thread's machine, and relative paths resolve against the current directory. The images are copied into the plugin, so the carousel keeps working after the files, worktree, or thread are cleaned up.

The JSON must be a single line: `--carousel-stdin` accepts exactly one line. Use `\n` inside a description for a line break.

```sh
bb image-carousel create --carousel-stdin <<'JSON'
{"kind":"research","title":"Workspace switchers","slides":[{"image":"research/linear.png","title":"Linear: search first","description":"Typing filters the list immediately.","source":"https://linear.app"},{"image":"research/slack.png","title":"Slack: icons in the rail","description":"One click per workspace; no menu."}]}
JSON
```

```sh
bb image-carousel create --carousel-stdin <<'JSON'
{"kind":"before-after","title":"Workspace switcher changes","slides":[{"before":"shots/menu-before.png","after":"shots/menu-after.png","title":"Menu gets search","description":"Type to find a workspace; the active one is checked."}]}
JSON
```

The command prints a directive such as `::image-carousel{id="ic_abc123def456"}`. Put that directive on its own line in your reply, outside any code fence. Emit the same directive again to reshow the carousel; don't create a duplicate.

Limits: up to 30 slides; PNG, JPEG, GIF, or WebP; 8 MB per image. Titles are one line of up to 120 characters; descriptions can be up to 2000 characters, and long ones scroll inside the fixed-height text area.

## Manage

```sh
bb image-carousel list [--thread <id>]
bb image-carousel get <id>
bb image-carousel remove <id>
```

Remove a carousel only when the user asks. Removing it deletes its image copies unless another carousel uses the same image, and every message that shows it will display "unavailable".
