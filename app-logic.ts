import type { DoctrineRule } from "./server";

export type IdentifierGradientStyle = {
  idle: string;
  selected: string;
};

export const SUBDOMAIN_GRADIENT_STYLES: Record<
  string,
  IdentifierGradientStyle
> = {
  operation: {
    idle: "to-cyan-500/5 hover:to-cyan-500/10",
    selected: "to-cyan-500/10 hover:to-cyan-500/15",
  },
  agency: {
    idle: "to-rose-500/5 hover:to-rose-500/10",
    selected: "to-rose-500/10 hover:to-rose-500/15",
  },
  context: {
    idle: "to-sky-500/5 hover:to-sky-500/10",
    selected: "to-sky-500/10 hover:to-sky-500/15",
  },
  instructions: {
    idle: "to-yellow-500/5 hover:to-yellow-500/10",
    selected: "to-yellow-500/10 hover:to-yellow-500/15",
  },
  terminology: {
    idle: "to-orange-500/5 hover:to-orange-500/10",
    selected: "to-orange-500/10 hover:to-orange-500/15",
  },
  density: {
    idle: "to-blue-500/5 hover:to-blue-500/10",
    selected: "to-blue-500/10 hover:to-blue-500/15",
  },
  hierarchy: {
    idle: "to-indigo-500/5 hover:to-indigo-500/10",
    selected: "to-indigo-500/10 hover:to-indigo-500/15",
  },
  organization: {
    idle: "to-emerald-500/5 hover:to-emerald-500/10",
    selected: "to-emerald-500/10 hover:to-emerald-500/15",
  },
  efficiency: {
    idle: "to-lime-500/5 hover:to-lime-500/10",
    selected: "to-lime-500/10 hover:to-lime-500/15",
  },
  feedback: {
    idle: "to-pink-500/5 hover:to-pink-500/10",
    selected: "to-pink-500/10 hover:to-pink-500/15",
  },
  input: {
    idle: "to-teal-500/5 hover:to-teal-500/10",
    selected: "to-teal-500/10 hover:to-teal-500/15",
  },
  navigation: {
    idle: "to-purple-500/5 hover:to-purple-500/10",
    selected: "to-purple-500/10 hover:to-purple-500/15",
  },
  handoff: {
    idle: "to-amber-500/5 hover:to-amber-500/10",
    selected: "to-amber-500/10 hover:to-amber-500/15",
  },
  validation: {
    idle: "to-green-500/5 hover:to-green-500/10",
    selected: "to-green-500/10 hover:to-green-500/15",
  },
  "design-system": {
    idle: "to-fuchsia-500/5 hover:to-fuchsia-500/10",
    selected: "to-fuchsia-500/10 hover:to-fuchsia-500/15",
  },
  color: {
    idle: "to-red-500/5 hover:to-red-500/10",
    selected: "to-red-500/10 hover:to-red-500/15",
  },
  imagery: {
    idle: "to-violet-500/5 hover:to-violet-500/10",
    selected: "to-violet-500/10 hover:to-violet-500/15",
  },
  layout: {
    idle: "to-cyan-300/5 hover:to-cyan-300/10",
    selected: "to-cyan-300/10 hover:to-cyan-300/15",
  },
};

export function displayDomainIdentifier(identifier: string): string {
  return identifier.toLocaleLowerCase();
}

export function domainFilterFromIdentifier(identifier: string): string {
  return displayDomainIdentifier(identifier).split(".", 1)[0] || "all";
}

export function subdomainFromIdentifier(identifier: string): string {
  const [, subdomain] = displayDomainIdentifier(identifier).split(".", 2);
  return subdomain || "unknown";
}

export function titleCaseDomainFilter(domain: string): string {
  const normalized = displayDomainIdentifier(domain);
  if (normalized === "ai") return "AI";
  return normalized
    .split("-")
    .map((part) => `${part.charAt(0).toLocaleUpperCase()}${part.slice(1)}`)
    .join(" ");
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
