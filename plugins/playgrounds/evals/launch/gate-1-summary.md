# Playgrounds launch — gate 1

Updated 2026-10-20T07:03:44.744885+00:00. All 80 attempts and saved-card replays are complete. Control counts include visual review and real-input adjudication; original agent runs and delivery times are unchanged.

**Gate decision:** NOT MET for the full prototype. The table separates delivery speed from verified-live cards; an excluded card is not automatically a dead-control finding.


| Revision / provider | Scored attempts | Median min | p90 min | Every control proven live | Questions | Progress |
|---|---:|---:|---:|---:|---:|---:|
| baseline — claude-code (final reviewed controls) | 20/20 | 9.93 | 15.00 | 14/20 | 0 | 15/20 |
| baseline — codex (final reviewed controls) | 20/20 | 1.91 | 2.75 | 6/20 | 0 | 20/20 |
| prototype — claude-code (final reviewed controls) | 20/20 | 3.93 | 5.52 | 19/20 | 0 | 19/20 |
| prototype — codex (final reviewed controls) | 20/20 | 1.46 | 1.70 | 15/20 | 0 | 20/20 |

Gate requires ≥18/20 cards with every exposed control proven live, 0 clarifying questions, median ≤3 min, and p90 ≤6 min. Missing cards retain 15-minute cap scores. Median is the mean of sorted positions 10 and 11; p90 is nearest rank (position 18 of 20), so two capped attempts can coexist with a p90 below the cap. The fixed 30-second render grace stays bounded by the cap, and every affected attempt remains logged. These are delivery times on a shared host. Resolved defaults were Claude Code `claude-opus-5-5` and Codex `gpt-6.1-sol`; four baseline Claude infrastructure failures ended before a model was resolved.

Baseline plugin `a632572aa58adc9b6ddf947c9e527587d09f22ca`; prototype `9de99949792c2c59b70693c1dcda6aa8cf36b428` (also includes R2 #510). Raw run evidence is private and is not included in this repository.

