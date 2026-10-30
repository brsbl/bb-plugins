/** One identified person from the census note: who they are and where they work. */
export interface CensusEntry {
  name: string;
  gh: string | null;
  dh: string | null;
  /** Company name, or null when the employer is unknown or not a company. */
  company: string | null;
  role: string;
}

const NOT_A_COMPANY = /^(unknown|unclear|unresolved|none|n\/a|—|-|self[- ]employed|independent|freelanc|contractor|student|retired|unemployed|stealth|not found|personal)/i;

const cells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split(" | ").map(cell => cell.trim());
const plain = (text: string) => text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*\*/g, "").trim();

/** The employer as a company name: links, parentheticals and self-employment parts removed. */
export function companyName(cell: string): string | null {
  const parts = plain(cell).replace(/\s*\([^)]*\)/g, "").split(/\s+\/\s+/).map(part => part.trim()).filter(Boolean);
  return parts.find(part => !NOT_A_COMPANY.test(part)) ?? null;
}

/**
 * Reads every Markdown table with an "Employer" column. The first column holds the person,
 * as `Name; [GH: login](…); D: handle`.
 */
export function parseCensus(markdown: string): CensusEntry[] {
  const entries: CensusEntry[] = [];
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index++) {
    if (!lines[index]!.trim().startsWith("|") || !/^\s*\|\s*:?-{3,}/.test(lines[index + 1]!)) continue;
    const header = cells(lines[index]!).map(cell => cell.toLowerCase());
    const employer = header.indexOf("employer");
    const role = header.indexOf("role");
    index += 2;
    for (; index < lines.length && lines[index]!.trim().startsWith("|"); index++) {
      if (employer < 0) continue;
      const row = cells(lines[index]!);
      const person = row[0] ?? "";
      const gh = /GH:\s*([A-Za-z0-9-]+)/.exec(person)?.[1];
      const dh = /D:\s*([A-Za-z0-9_.]+)/.exec(person)?.[1];
      const login = gh && gh.toLowerCase() !== "unlinked" ? gh : null;
      const handle = dh && dh.toLowerCase() !== "unlinked" ? dh : null;
      if (!login && !handle) continue;
      const name = plain(person.split(";")[0] ?? "");
      entries.push({
        name: name && !/^(GH|D):/.test(name) ? name : (login ?? handle ?? ""),
        gh: login,
        dh: handle,
        company: companyName(row[employer] ?? ""),
        role: role >= 0 ? plain(row[role] ?? "") : "",
      });
    }
    index--;
  }
  return entries;
}
