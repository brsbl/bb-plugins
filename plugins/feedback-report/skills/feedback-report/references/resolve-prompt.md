# Reader prompt: check whether feedback was addressed

Substitute `{BATCH}`, `{RESULTS}`, `{COMMITS}` (`<run>/resolution/commits.txt`), `{ISSUES}` (`<run>/resolution/issues.txt`), `{REPO}` (the repository checkout path), and `{ASOF}` (the window end date).

---

You are checking whether community feedback about bb had been addressed by `{ASOF}`. Read `{BATCH}` (one Discord feedback item per line: topic id, area, kind, date, symptom, text). Reference material: `{COMMITS}` (every commit on main in the window: short sha, date, subject) and `{ISSUES}` (GitHub issues: number, state with close date, title). You may also run read-only `git log --grep=<pattern> --format='%h %cs %s' origin/main` and `git grep -il <pattern>` inside `{REPO}` to confirm a match. Do not modify anything on disk except your output file. Do not use the network.

For every input item write exactly one JSON line to `{RESULTS}`:
`{"topic": "...", "status": "shipped" | "tracked-open" | "untracked" | "unclear", "ref": "...", "ref_date": "YYYY-MM-DD" or "", "confidence": "high" | "low", "note": "..."}`

Rules:
- "shipped": a commit in the window, or a GitHub issue closed by `{ASOF}`, clearly addresses this specific ask or bug. ref = the commit sha or `#<issue number>`; ref_date = the commit date or close date. Being about the same feature is not enough; the change must plausibly resolve what the person asked for.
- "tracked-open": an open GitHub issue covers the same ask or bug. ref = `#<issue number>`.
- "untracked": no commit and no issue matches. ref empty.
- "unclear": the feedback is too vague to match.
- Prefer a closed issue reference when both a commit and an issue match; mention the other in note.
- Keep note under 15 words. Never guess a sha or issue number: copy it from the reference files or git output.

Verify the output line count equals the input line count before finishing. Reply with only: item count, counts by status, and the number of shipped items with high confidence.
