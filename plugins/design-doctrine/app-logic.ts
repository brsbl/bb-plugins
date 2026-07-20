import type { DoctrineRule } from "./server";

export type IdentifierMeshStyle = {
  idle: string;
  selected: string;
};

export const SUBDOMAIN_MESH_STYLES: Record<
  string,
  IdentifierMeshStyle
> = {
  operation: {
    idle: "bg-cyan-300/40 group-hover:bg-cyan-300/50",
    selected: "bg-cyan-300/55 group-hover:bg-cyan-300/65",
  },
  agency: {
    idle: "bg-rose-300/40 group-hover:bg-rose-300/50",
    selected: "bg-rose-300/55 group-hover:bg-rose-300/65",
  },
  context: {
    idle: "bg-sky-300/40 group-hover:bg-sky-300/50",
    selected: "bg-sky-300/55 group-hover:bg-sky-300/65",
  },
  instructions: {
    idle: "bg-amber-200/40 group-hover:bg-amber-200/50",
    selected: "bg-amber-200/55 group-hover:bg-amber-200/65",
  },
  terminology: {
    idle: "bg-orange-300/40 group-hover:bg-orange-300/50",
    selected: "bg-orange-300/55 group-hover:bg-orange-300/65",
  },
  density: {
    idle: "bg-blue-300/40 group-hover:bg-blue-300/50",
    selected: "bg-blue-300/55 group-hover:bg-blue-300/65",
  },
  hierarchy: {
    idle: "bg-indigo-300/40 group-hover:bg-indigo-300/50",
    selected: "bg-indigo-300/55 group-hover:bg-indigo-300/65",
  },
  organization: {
    idle: "bg-emerald-300/40 group-hover:bg-emerald-300/50",
    selected: "bg-emerald-300/55 group-hover:bg-emerald-300/65",
  },
  efficiency: {
    idle: "bg-lime-300/40 group-hover:bg-lime-300/50",
    selected: "bg-lime-300/55 group-hover:bg-lime-300/65",
  },
  feedback: {
    idle: "bg-pink-300/40 group-hover:bg-pink-300/50",
    selected: "bg-pink-300/55 group-hover:bg-pink-300/65",
  },
  input: {
    idle: "bg-teal-300/40 group-hover:bg-teal-300/50",
    selected: "bg-teal-300/55 group-hover:bg-teal-300/65",
  },
  navigation: {
    idle: "bg-violet-300/40 group-hover:bg-violet-300/50",
    selected: "bg-violet-300/55 group-hover:bg-violet-300/65",
  },
  handoff: {
    idle: "bg-yellow-300/40 group-hover:bg-yellow-300/50",
    selected: "bg-yellow-300/55 group-hover:bg-yellow-300/65",
  },
  validation: {
    idle: "bg-green-300/40 group-hover:bg-green-300/50",
    selected: "bg-green-300/55 group-hover:bg-green-300/65",
  },
  "design-system": {
    idle: "bg-fuchsia-300/40 group-hover:bg-fuchsia-300/50",
    selected: "bg-fuchsia-300/55 group-hover:bg-fuchsia-300/65",
  },
  color: {
    idle: "bg-red-300/40 group-hover:bg-red-300/50",
    selected: "bg-red-300/55 group-hover:bg-red-300/65",
  },
  imagery: {
    idle: "bg-purple-300/40 group-hover:bg-purple-300/50",
    selected: "bg-purple-300/55 group-hover:bg-purple-300/65",
  },
  layout: {
    idle: "bg-cyan-200/40 group-hover:bg-cyan-200/50",
    selected: "bg-cyan-200/55 group-hover:bg-cyan-200/65",
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
