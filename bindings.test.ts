import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { bindingProblems } from "./bindings.js";
import { assertKitMarkup } from "./validate.js";

const toggle = '<button data-pg="toggle" data-param="email" data-label="Email notifications"></button>';
const script = (js: string) => `<script>${js}</script>`;

it("accepts the shipped reference cards", () => {
  const dir = new URL("./skills/playgrounds/references/", import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".html"))) expect({ file, problems: bindingProblems(readFileSync(new URL(file, dir), "utf8")) }).toEqual({ file, problems: [] });
});

it("rejects unused controls with the parameter and a repair", () => {
  expect(() => assertKitMarkup(toggle)).toThrow(/control "email" has no consumer.*params.on\(update\)/);
  expect(bindingProblems(toggle + script('playground.params.set({email: true})'))).toEqual([expect.stringContaining('control "email" has no consumer')]);
});

it("checks named reads, writes and object setters through aliases", () => {
  const problems = bindingProblems(toggle + script(`
    const pg = window.playground, P = pg.params;
    P.get("email"); P.get("emali"); P.set({sms: true}); P.set("push", false);
  `));
  expect(problems).toHaveLength(3);
  for (const name of ["emali", "sms", "push"]) expect(problems).toContainEqual(expect.stringContaining(`parameter "${name}" is undeclared`));
});

it("checks destructuring and properties of all() results", () => {
  const problems = bindingProblems(toggle + script(`
    const {params: P} = playground;
    const {email, sms: text} = P.all();
    const inputs = P.all(); console.log(inputs.push, inputs["digest"], P.all().missing);
  `));
  expect(problems).toHaveLength(4);
  for (const name of ["sms", "push", "digest", "missing"]) expect(problems).toContainEqual(expect.stringContaining(`parameter "${name}" is undeclared`));
});

it("accepts declarations across scripts, object setters, and conditional panels", () => {
  expect(bindingProblems(toggle + '<p data-show="email=true">Preview</p>' + script('playground.params.set({email: true})'))).toEqual([]);
  expect(bindingProblems(script('const {params} = playground; params.define("sms", {type:"toggle"})') + script('params.set({sms: true}); params.get("sms")'))).toEqual([]);
  expect(bindingProblems('<p data-show="unknown=true">Preview</p>')).toEqual([expect.stringContaining('parameter "unknown" is undeclared')]);
});

it("does not treat unrelated objects, comments, JSON or shadowed names as the kit", () => {
  expect(bindingProblems(script(`
    // playground.params.get("comment")
    const text = 'playground.params.get("string")';
    const params = {get() {}}; params.get("unrelated");
    function test(playground) { playground.params.get("shadowed") }
    { const playground = other; playground.params.set("local", 1); }
  `) + '<script type="application/json">{"content":"<div data-pg=toggle>"}</script>' + '<!-- <script>playground.params.get("comment")</script> -->')).toEqual([]);
});

it("fails with an actionable syntax/setter error without running scripts", () => {
  expect(bindingProblems(script('throw new Error("must not run"); playground.params.set("email")'))).toEqual([expect.stringContaining('use params.set(name, value) or params.set({ name: value })')]);
  expect(bindingProblems(script('const = broken'))).toEqual([expect.stringContaining("fix the card's JavaScript")]);
});

it("keeps dynamic consumers and built-in guide/game bindings valid", () => {
  expect(bindingProblems(toggle + script('const P = playground.params; P.get(dynamicName)'))).toEqual([]);
  expect(bindingProblems('<div data-pg="guide"><section data-step="1">Step</section></div>')).toEqual([]);
  expect(bindingProblems('<div data-pg="board" data-param="board"></div>' + script('playground.ui.game({move(){}}); playground.params.get("turn")'))).toEqual([]);
});
