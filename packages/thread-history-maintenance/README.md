# Thread History Maintenance

This private workspace package lets bb plugins learn from completed user task episodes without loading thread history into their runtime interactions.

It queues visible user threads on `thread.idle`, stores one checkpoint per thread, and reads only unseen timeline rows during a bounded maintenance scan. A lease makes advance or retry explicit, while startup and monthly inventory reconciliation recover events missed during plugin downtime.

Each scan reads at most four timeline pages of 100 segments per candidate. Because bb's `afterSequence` parameter is a cache-dependent latest-window delta rather than forward pagination, large backlogs use the timeline's backward cursor instead: the package persists that hydration cursor, returns no messages, and resumes from it on the next scan. The learning checkpoint advances only after the scan reaches the previous checkpoint, so the bound cannot skip unseen messages.
