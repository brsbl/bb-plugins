// Static checks only: never execute a published card's JavaScript on the server.
// Dynamic names/whole-state consumers remain the author's responsibility to exercise.
import { parse, type Node } from "acorn";
import { startTags } from "./validate.js";

// Acorn nodes have heterogeneous fields. Keep the traversal generic, and narrow at
// the few expression shapes whose meaning we know rather than interpreting JS.
type Ast = Node & { [key: string]: unknown };
type Kind = "window" | "api" | "params" | "ui" | "values";
type Scope = Map<string, Kind | undefined>;
const node = (value: unknown): Ast | undefined => value && typeof value === "object" && "type" in value ? value as Ast : undefined;
const string = (value: unknown): string | undefined => {
  const n = node(value);
  if (n?.type === "Literal" && typeof n.value === "string") return n.value;
  if (n?.type === "TemplateLiteral" && Array.isArray(n.expressions) && !n.expressions.length) return (n.quasis as { value: { cooked: string } }[])[0]?.value.cooked;
};
const key = (n: Ast) => n.computed ? string(n.property ?? n.key) : (node(n.property ?? n.key)?.name as string | undefined) ?? string(n.key);
function member(kind: Kind | undefined, name: string | undefined): Kind | undefined {
  if (kind === "window" && (name === "playground" || name === "answer")) return "api";
  if (kind === "api" && (name === "params" || name === "ui")) return name;
}
function meaning(value: unknown, scope: Scope): Kind | undefined {
  const n = node(value);
  if (!n) return;
  if (n.type === "Identifier") return scope.get(n.name as string);
  if (n.type === "ChainExpression") return meaning(n.expression, scope);
  if (n.type === "MemberExpression") return member(meaning(n.object, scope), key(n));
  const c = node(n.callee);
  if (n.type === "CallExpression" && c?.type === "MemberExpression" && meaning(c.object, scope) === "params" && key(c) === "all") return "values";
}
function bind(pattern: unknown, kind: Kind | undefined, scope: Scope) {
  const n = node(pattern);
  if (!n) return;
  if (n.type === "Identifier") scope.set(n.name as string, kind);
  else if (n.type === "AssignmentPattern") bind(n.left, kind, scope);
  else if (n.type === "RestElement") bind(n.argument, undefined, scope);
  else if (n.type === "ObjectPattern") for (const p of n.properties as Ast[]) bind(p.value ?? p.argument, member(kind, key(p)), scope);
  else if (n.type === "ArrayPattern") for (const p of n.elements as unknown[]) bind(p, undefined, scope);
}

export function bindingProblems(html: string): string[] {
  const elements = [...startTags(html)];
  const declared = new Set<string>(), used = new Set<string>();
  const controls = new Map<string, number>();
  const refs: { name: string; at: number }[] = [];
  const problems: string[] = [];
  let consumesAll = false, dynamicDeclarations = false;
  const where = (at: number) => `line ${html.slice(0, at).split("\n").length}`;
  const reference = (name: string | undefined, at: number, read = true) => {
    if (name === undefined) { if (read) consumesAll = true; return; }
    refs.push({ name, at });
    if (read) used.add(name);
  };
  for (const el of elements) {
    const kind = el.attrs.get("pg"), name = el.attrs.get("param");
    if (kind && name) { declared.add(name); controls.set(name, el.index); }
    if (kind === "guide") { declared.add(name ?? "step"); used.add(name ?? "step"); }
    const show = /^([A-Za-z][\w-]*)!?=/.exec(el.attrs.get("show") ?? "");
    if (show) reference(show[1], el.index);
  }
  const global: Scope = new Map([["window", "window"], ["globalThis", "window"], ["playground", "api"], ["answer", "api"]]);
  function visit(n: Ast, scope: Scope, offset: number) {
    // Block/function bindings shadow API aliases, including before a declaration.
    if (["Program", "BlockStatement", "ArrowFunctionExpression", "FunctionExpression", "FunctionDeclaration"].includes(n.type)) {
      if (n.type !== "Program") scope = new Map(scope);
      if (Array.isArray(n.params)) for (const p of n.params) bind(p, undefined, scope);
      const body = Array.isArray(n.body) ? n.body as Ast[] : [];
      for (const child of body) {
        if (child.type === "VariableDeclaration") for (const d of child.declarations as Ast[]) bind(d.id, undefined, scope);
        if (child.type === "FunctionDeclaration" || child.type === "ClassDeclaration") bind(child.id, undefined, scope);
      }
      for (const child of body) if (child.type === "VariableDeclaration") for (const d of child.declarations as Ast[]) bind(d.id, meaning(d.init, scope), scope);
    }
    if (n.type === "VariableDeclarator") {
      const kind = meaning(n.init, scope);
      bind(n.id, kind, scope);
      const pattern = node(n.id);
      if (kind === "values" && pattern?.type === "ObjectPattern") for (const p of pattern.properties as Ast[]) if (p.type === "Property") reference(key(p), offset + p.start);
    }
    if (n.type === "MemberExpression" && meaning(n.object, scope) === "values") reference(key(n), offset + n.start);
    if (n.type === "CallExpression") {
      const c = node(n.callee), args = n.arguments as Ast[];
      if (c?.type === "MemberExpression") {
        const target = meaning(c.object, scope), method = key(c), at = offset + n.start;
        if (target === "params") {
          if (method === "define") {
            const name = string(args[0]);
            if (name === undefined) dynamicDeclarations = true; else declared.add(name);
          } else if (method === "get" || method === "format" || method === "spec") reference(string(args[0]), at);
          else if (method === "all") consumesAll = true;
          else if (method === "on" && Array.isArray(args[0]?.params) && args[0].params.length) consumesAll = true;
          else if (method === "set") {
            if (args.length === 1 && args[0]?.type === "ObjectExpression") {
              for (const p of args[0].properties as Ast[]) if (p.type === "Property") reference(key(p), at, false);
            } else if (args.length === 2) reference(string(args[0]), at, false);
            else if (args.length !== 1 || args[0]?.type === "Literal") problems.push(`${where(at)}: use params.set(name, value) or params.set({ name: value }).`);
          }
        }
        // These sets consume their inputs internally, rather than in card code.
        if (target === "ui" && method === "game") { declared.add("turn"); consumesAll = true; }
        if (target === "ui" && method === "on" && ["change", "select"].includes(string(args[0]) ?? "")) consumesAll = true;
      }
    }
    for (const [field, value] of Object.entries(n)) {
      if (["start", "end", "loc"].includes(field)) continue;
      for (const child of Array.isArray(value) ? value : [value]) { const ast = node(child); if (ast) visit(ast, scope, offset); }
    }
  }
  for (const el of elements) {
    if (el.name !== "script" || el.attributes.has("src")) continue;
    const type = el.attributes.get("type")?.toLowerCase();
    if (type && !["module", "text/javascript", "application/javascript"].includes(type)) continue;
    try {
      const ast = parse(el.content, { ecmaVersion: "latest", sourceType: type === "module" ? "module" : "script" });
      visit(ast as Ast, type === "module" ? new Map(global) : global, el.contentStart);
    } catch (error) {
      // Syntax errors would prevent all controls in this script from working.
      const e = error as Error & { pos?: number };
      problems.push(`${where(el.contentStart + (e.pos ?? 0))}: fix the card's JavaScript before publishing: ${e.message}`);
    }
  }
  if (!dynamicDeclarations) for (const { name, at } of refs) if (!declared.has(name)) problems.push(`${where(at)}: parameter "${name}" is undeclared. Add a data-pg control with data-param="${name}" or call params.define("${name}", spec) before using it; check for a misspelling.`);
  if (!consumesAll) for (const [name, at] of controls) if (!used.has(name)) problems.push(`${where(at)}: control "${name}" has no consumer. Read it in your model/preview and redraw with params.on(update), or bind a panel with data-show="${name}=value". Remove the control if it has no effect.`);
  return [...new Set(problems)];
}
