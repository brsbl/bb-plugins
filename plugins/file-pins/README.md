# File Pins

Keep local files within reach in each thread. Pins stay above the composer even
when the file viewer is closed, and are shared across clients.

![Persistent thread file pins](https://github.com/user-attachments/assets/5bd17727-04ad-4f61-8d9f-c1beb1b3db52)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/file-pins --yes
```

## Use

Click **Pin a file** above a thread's composer, enter its absolute or `~/` path,
and choose the machine holding it. Click a filename to open it; the adjacent
cross removes the pin without deleting the file.

```bash
bb file-pins pin '~/Moss/Notes/Tweets/Tweets.md' --machine host_37m3sgpq59
bb file-pins list --thread thr_example --json
bb file-pins unpin <pin-id> --thread thr_example
```

`--thread` defaults to the current thread. The file host defaults to the invoking
thread's host, then the target thread's host. Relative CLI paths use the invoking
thread's directory only when it belongs to that same host. Duplicate paths on
the same host produce one pin; each thread supports 40 pins.

Paths resolve on the selected machine through the plugin's host entry. File
contents never enter pin storage. Pins survive reloads and thread environment
changes and can be removed while a machine is offline. Deleting the thread
removes its pins. Pinning does not send file content to the agent.

A normal click on a Markdown note under the file host's `~/Moss/Notes/`, or a
Markdown file containing a `moss-*` fence or `:::tabs` marker, opens the **Moss
Mac app** on that host. Moss must be installed there. This explicit Moss rule
overrides the default opener for the normal click; the existing right-click
menu stays available. Other files retain bb's FileLink behavior and its opener
choices. Classification and launch run on the host; no Markdown or Moss parser
or renderer is included.

## Develop

Remote CI runs `npm run check --workspace=bb-plugin-file-pins`. For targeted UI
verification, build/install this package in an isolated bb development app.
