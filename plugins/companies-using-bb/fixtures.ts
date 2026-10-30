// Synthetic test data only: fictional companies, people and handles.
import type { CensusEntry } from "./census.js";
import type { GithubCursor } from "./github.js";
import type { Person, Row, Snapshot } from "./model.js";

export function person(overrides: Partial<Person> = {}): Person {
  return {
    n: "Octo Cat", gh: "octocat", li: "", d: false, role: "Engineer", champ: false, sl: false,
    i: 0, iu: "", p: 0, pu: "", il: [], pl: [], dd: null, dm: [], dh: null, ...overrides,
  };
}

export function row(overrides: Partial<Row> = {}): Row {
  return {
    c: "Acme", full: "Acme, Inc.", url: "https://acme.example", site: true, seg: "Team", pr: "P1", emp: 120, size: "51–200",
    src: "https://acme.example/about", country: "Canada", region: "North America", unv: false, comp: false,
    iss: 0, prs: 0, dis: 0, slack: false, n: 1, ppl: [person()], ...overrides,
  };
}

export function snapshot(rows: Row[] = [row()], overrides: Partial<Snapshot> = {}): Snapshot {
  return { version: 1, updatedAt: "2026-01-02T06:00:00.000Z", rows, ...overrides };
}

export function github(items: GithubCursor["items"] = {}): GithubCursor {
  return { repos: { "example/app": "2026-01-03T00:00:00Z" }, items };
}

export function census(entries: Partial<CensusEntry>[]): CensusEntry[] {
  return entries.map(entry => ({ name: "Mona Lisa", gh: null, dh: null, company: null, role: "", ...entry }));
}
