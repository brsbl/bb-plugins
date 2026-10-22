/** Locate a newly entered colon, including one replacing selected text. */
export function insertedColon(before: string, after: string): number | null {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > start && afterEnd > start && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd--;
    afterEnd--;
  }
  return after.slice(start, afterEnd) === ":" ? start : null;
}
