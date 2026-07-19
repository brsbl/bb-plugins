import type { DoctrineRule } from "./server";

export function displayDomainIdentifier(identifier: string): string {
  return identifier.toLocaleLowerCase();
}

export function domainFilterFromIdentifier(identifier: string): string {
  return displayDomainIdentifier(identifier).split(".", 1)[0] || "all";
}

export function rulePath(id: string): string {
  return `rule/${encodeURIComponent(id)}`;
}

export function ruleIdFromPath(path: string): string | null {
  if (!path.startsWith("rule/")) return null;
  try {
    return decodeURIComponent(path.slice(5)) || null;
  } catch {
    return null;
  }
}

export function toggledRulePath(
  selectedRuleId: string | null,
  nextRuleId: string,
): string {
  return selectedRuleId === nextRuleId ? "" : rulePath(nextRuleId);
}

function searchableText(rule: DoctrineRule): string {
  return [
    rule.id,
    rule.title,
    rule.statement,
    rule.why,
    rule.kind,
    rule.strength,
    rule.confidence,
    rule.domain,
    ...rule.products,
    ...rule.activities,
    ...rule.artifacts,
    ...rule.surfaces,
    ...rule.prefer,
    ...rule.avoid,
    ...rule.use_when,
    ...rule.not_when,
    ...rule.exceptions,
    ...rule.evidence,
    ...rule.checks,
  ]
    .join("\n")
    .toLocaleLowerCase();
}

export function filterRules(
  rules: DoctrineRule[],
  domain: string,
  query: string,
): DoctrineRule[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return rules.filter((rule) => {
    if (domain !== "all" && !rule.domain.startsWith(`${domain}.`)) return false;
    if (!terms.length) return true;
    const text = searchableText(rule);
    return terms.every((term) => text.includes(term));
  });
}

export function detailRowEndIndex(
  selectedIndex: number,
  resultCount: number,
  columnCount: number,
): number {
  if (selectedIndex < 0 || resultCount < 1) return -1;
  return Math.min(
    resultCount - 1,
    Math.floor(selectedIndex / columnCount) * columnCount + columnCount - 1,
  );
}
