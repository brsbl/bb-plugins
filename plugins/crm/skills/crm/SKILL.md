---
name: crm
description: Read or update the private customer and investor pipeline with bb crm.
---

# CRM

Use `bb crm` for companies, people, independent angels, pipeline tracks and
interaction notes. Open CRM in bb to read the pipeline grouped by company.

Data is stored in this plugin's private SQLite database on the bb server's
machine. Do not copy real records into a repository, tests, screenshots, public
issues or PRs. There is no external CRM sync. Logging an interaction does not
send a message.

## Import and update

List existing records first. Use explicit stable IDs for imports; a duplicate ID
returns an error without changing anything. Use update for corrections.
All commands support `--json`; errors return a nonzero exit code and
`{ok:false,error:{code,message}}`. Use each command's `--help` for every flag.

```sh
bb crm add company "Acme Example" --id acme --json
bb crm add person "Alex Example" --id alex --company acme --role "Engineering lead" --json
bb crm add track --company acme --kind customer --person alex --stage "Champion engaged" --next "Start a shared channel" --owner "Sam Demo" --date 2026-10-20 --json
bb crm list --type tracks --company acme --json
bb crm update track TRACK_ID --stage "Shared channel" --next "Book a usage call" --json
bb crm log --person alex --kind call --date 2026-10-12 --note "Fictional team wants to try it together." --track customer --json
```

Each company can have one customer and one investor track, with different
contacts or the same person. Add a company contact before assigning that person
to its track. Omit the contact until one is known.

For an independent angel, omit `--company` when adding the person, then use
`add track --person PERSON_ID --kind investor`. Independent people have investor
tracks only. Dates are calendar dates in YYYY-MM-DD form.

Customer stages: Champion identified → Champion engaged → Shared channel →
Usage deep-dive → Expanding → Case study.

Investor stages: Identified → Intro requested → Intro made → Conversation →
Committed.

`update company ID --name …` renames a company.
`update person ID --name … --role … --company …` changes a person.
Use `--clear-company` to make a person independent when no assigned track
prevents the move. Clear company-track assignments first with
`update track ID --clear-person`. An independent person with an investor track
must remain independent. Moving a person never rewrites old interaction history.

Use `update track ID --clear-date` to clear a deadline. Empty `--next ""` or
`--owner ""` clears that field. Updates preserve omitted fields.

## Read and log

`list --type companies|people|tracks|interactions` returns
`{items,nextOffset}`. Follow `--offset NEXT_OFFSET` until nextOffset is null.
The default page is 50; `--limit` accepts 1–100. Use `--company ID` or
`--person ID` to narrow the result. Tracks include stable IDs and contact IDs.

`log` needs `--company` or `--person`, `--kind message|call|intro`,
`--date` and `--note` (up to 2000 characters). A person's current company is
recorded automatically. Optional `--track customer|investor` marks the context;
omit it for a general or shared conversation. Use `--id` on imported notes to
prevent duplicates. `--note-stdin` and `--next-stdin` accept multiline input.

The UI supports search, track filters and expandable history. Mutations belong
to the CLI. The MVP does not send messages, sync contacts, score leads or delete
records.

