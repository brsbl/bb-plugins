import path from "node:path";
import { fail } from "./cli.mjs";
import { parseCsvRecords } from "./csv.mjs";
import { readText } from "./io.mjs";

export function readLedger(runDir) {
  const filePath = path.join(runDir, "commits", "ledger.csv");
  const rows = parseCsvRecords(readText(filePath));
  return rows.map((row, index) => {
    for (const key of ["sha", "date", "week", "subject", "area"]) {
      if (row[key] === undefined) fail(`${filePath} row ${index + 2} is missing column ${key}`);
    }
    const week = Number(row.week);
    if (!Number.isInteger(week)) fail(`${filePath} row ${index + 2} has a non-integer week: ${row.week}`);
    return {
      sha: row.sha,
      date: row.date,
      week,
      subject: row.subject,
      area: row.area,
      pr: (row.pr ?? "").trim(),
      closesIssues: (row.closes_issues ?? "").trim(),
    };
  });
}
