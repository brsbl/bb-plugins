# Thread History Maintenance

This private workspace package lets bb plugins learn from completed user task episodes without loading thread history into their runtime interactions.

It queues visible user threads on `thread.idle`, stores one checkpoint per thread, and reads only unseen timeline rows during a bounded maintenance scan. A lease makes advance or retry explicit, while startup and monthly inventory reconciliation recover events missed during plugin downtime.
