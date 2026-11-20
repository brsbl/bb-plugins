# Synthetic note fixture

`Studio plan.md` contains invented content for isolated QA and screenshots. Do not copy it into anyone's real Moss workspace.

For the read-only state, copy it to a new temporary directory and open that copy in an isolated bb. Its Moss callout makes it a Moss note outside the default workspace. Leave out `meta.json` so the not-adopted message appears. On Linux, **Show in Finder** should explain that Finder is available only on a Mac.

For the editable state, use a disposable macOS account with a fresh Moss workspace and an isolated bb connected to that account. Create a note named **Studio plan** in Moss, replace its body with this fixture, then open it once in Moss so Moss creates the metadata. Open the adopted note in bb, change the final sentence and wait for saving to finish. Never fabricate metadata as evidence of Mac compatibility.

Use bb's header-hiding control before the editor capture so no filesystem path appears. Keep the read-only explanation visible in the viewer capture while framing out the path and unrelated chrome. Use synthetic project and thread titles throughout. Capture each state at least 1200 pixels wide and at most 2 MiB; the screenshot worker owns image capture and replacement.
