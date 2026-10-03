# File Pins

Keep local files within reach in each thread. Pins stay above the composer even
when the file viewer is closed, and are shared across clients.

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

Files open through bb's semantic host-file preview and its selected file opener.
Moss rendering and detection belong to the separate **Moss viewer** plugin; that
viewer and its routing integration must be installed for Moss-specific rendering.
File Pins contains no Markdown or Moss parser.

## Develop

Remote CI runs `npm run check --workspace=bb-plugin-file-pins`. For targeted UI
verification, build/install this package in an isolated bb development app.
