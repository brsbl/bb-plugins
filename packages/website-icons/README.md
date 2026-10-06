# Website Icons

This private workspace package resolves a public HTTPS origin's favicon for Compact Links and Pins.

It contacts only the origin (never a pasted path, query or fragment), refuses private addresses, nonstandard ports and credentials, bounds sizes, redirects and concurrency, and re-encodes the result as a small PNG data URL. `createIconCache` keeps disposable origin-level results in the calling plugin's own database.
