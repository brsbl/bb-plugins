// `bb space`: list, inspect, and organize Spaces. Reading a Space starts no turns.

import { cliCommand, defineCli, PluginCliError, type PluginCliRegistration, type PluginCliResult } from "@get-bb/plugin-sdk";

import type { SpaceSummary } from "./contract";
import { countText, statusText } from "./model";
import type { SpacesService } from "./service";

const MAX_THREADS = 100;
const MAX_NAME_LENGTH = 120;

const json = { type: "boolean", description: "Print machine-readable JSON" } as const;
const spacePositional = { name: "space", description: "Space name (exact, any case) or section ID", required: true } as const;
const threadsPositional = {
  name: "threads",
  description: `Thread IDs, up to ${MAX_THREADS}`,
  required: true,
  variadic: true,
} as const;

function out(text: string): PluginCliResult {
  return { exitCode: 0, stdout: text.endsWith("\n") ? text : `${text}\n` };
}

/** Service errors are plain Errors; report them like parse errors instead of as a crash. */
async function reported<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof PluginCliError) throw error;
    throw new PluginCliError(error instanceof Error ? error.message : String(error), { code: "space_failed" });
  }
}

function matchByName<T>(items: readonly T[], ref: string, nameOf: (item: T) => string): T[] {
  const wanted = ref.trim().toLowerCase();
  return items.filter((item) => nameOf(item).trim().toLowerCase() === wanted);
}

/** A section ID, or an exact case-insensitive name. More than one match is an error naming each. */
async function resolveSpace(service: SpacesService, ref: string): Promise<SpaceSummary> {
  const spaces = await reported(() => service.listSpaces());
  const byId = spaces.find((space) => space.sectionId === ref);
  if (byId) return byId;
  const matches = matchByName(spaces, ref, (space) => space.name);
  const [match] = matches;
  if (matches.length === 1 && match) return match;
  if (matches.length > 1) {
    throw new PluginCliError(
      `"${ref}" matches ${matches.length} Spaces: ${matches.map((space) => `${space.name} (${space.sectionId})`).join(", ")}.`,
      { code: "ambiguous_space", hint: "Pass the section ID instead." },
    );
  }
  throw new PluginCliError(`No Space is named "${ref}".`, {
    code: "space_not_found",
    hint: "Run `bb space list` to see your Spaces, or `bb space create <name>` to make one.",
  });
}

async function resolveSection(service: SpacesService, ref: string): Promise<{ id: string; name: string }> {
  const sections = await reported(() => service.allSections());
  const byId = sections.find((section) => section.id === ref);
  if (byId) return byId;
  const matches = matchByName(sections, ref, (section) => section.name);
  const [match] = matches;
  if (matches.length === 1 && match) return match;
  if (matches.length > 1) {
    throw new PluginCliError(
      `"${ref}" matches ${matches.length} sections: ${matches.map((section) => `${section.name} (${section.id})`).join(", ")}.`,
      { code: "ambiguous_section", hint: "Pass the section ID instead." },
    );
  }
  throw new PluginCliError(`No section is named "${ref}".`, {
    code: "section_not_found",
    hint: "Omit --from-section to create a new section for the Space.",
  });
}

function requireThreadCount(threads: readonly string[]): void {
  if (threads.length > MAX_THREADS) {
    throw new PluginCliError(`Pass at most ${MAX_THREADS} threads at a time; got ${threads.length}.`, { code: "too_many_threads" });
  }
}

export function createCli(service: SpacesService): PluginCliRegistration {
  return defineCli({
    name: "space",
    summary: "List, inspect, and organize Spaces: sidebar sections of related threads from any project",
    description:
      "A Space is a sidebar section that Spaces marks. Its members are the top-level threads in that section, from any project; subthreads stay with their parent. <space> is a Space's section ID or its exact name in any case. Reading a Space starts no turns.",
    commands: {
      list: cliCommand({
        summary: "List every Space with its section ID and member count",
        options: { json },
        async run(input) {
          const spaces = await reported(() => service.listSpaces());
          if (input.options.json) return out(JSON.stringify({ spaces }, null, 2));
          if (spaces.length === 0) return out("No Spaces yet. Make one with `bb space create <name>`.");
          return out(spaces.map((space) => `${space.name} · ${space.sectionId} · ${countText(space.memberCount)}`).join("\n"));
        },
      }),
      status: cliCommand({
        summary: "Show each member's ID, state, title, and latest output, most urgent first",
        description:
          "One line per live member: ID · state (needs you, working, new output, idle) · title — latest output, cut to 140 characters. --json adds archived members and full excerpts. Starts no turns.",
        positionals: [spacePositional],
        options: { json },
        async run(input) {
          const space = await resolveSpace(service, input.positionals.space);
          const snapshot = await reported(() => service.snapshot(space.sectionId));
          return out(input.options.json ? JSON.stringify(snapshot, null, 2) : statusText(snapshot));
        },
      }),
      create: cliCommand({
        summary: "Make a Space as a new section, or from an existing section with --from-section",
        positionals: [{ name: "name", description: `Space name, up to ${MAX_NAME_LENGTH} characters`, required: true }],
        options: {
          "from-section": {
            type: "string",
            description:
              "Mark this existing section (ID or exact name) as the Space instead of creating one, renaming it to <name> if they differ. Its threads stay in place. Thread Organizer inboxes can't be Spaces.",
            aliases: ["section", "from"],
          },
        },
        async run(input) {
          const name = input.positionals.name.trim();
          if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
            throw new PluginCliError(`A Space name needs 1 to ${MAX_NAME_LENGTH} characters.`, { code: "invalid_value" });
          }
          const from = input.options["from-section"];
          if (from === undefined) {
            const space = await reported(() => service.rpc.createSpace({ name }));
            return out(`Created the Space "${space.name}" (${space.sectionId}). Add threads with \`bb space add <thread…> --space ${space.sectionId}\`.`);
          }
          const section = await resolveSection(service, from);
          let space = await reported(() => service.rpc.makeSpace({ sectionId: section.id }));
          if (space.name !== name) space = await reported(() => service.rpc.renameSpace({ sectionId: section.id, name }));
          return out(`"${space.name}" (${space.sectionId}) is now a Space with ${countText(space.memberCount)}.`);
        },
      }),
      add: cliCommand({
        summary: "Move top-level threads into a Space; subthreads stay with their parent",
        positionals: [threadsPositional],
        options: { space: { type: "string", required: true, description: "Space name (exact, any case) or section ID" } },
        async run(input) {
          requireThreadCount(input.positionals.threads);
          const space = await resolveSpace(service, input.options.space);
          const { added, skipped } = await reported(() =>
            service.rpc.addThreads({ sectionId: space.sectionId, threadIds: input.positionals.threads }));
          const lines = [`Moved ${countText(added.length)} into "${space.name}".`];
          if (skipped.length > 0) {
            lines.push(`Skipped ${skipped.join(", ")}: subthreads stay with their parent, and hidden or missing threads can't join.`);
          }
          return out(lines.join("\n"));
        },
      }),
      remove: cliCommand({
        summary: "Move threads out of their Space into the loose Threads list",
        positionals: [threadsPositional],
        async run(input) {
          requireThreadCount(input.positionals.threads);
          const { removed } = await reported(() => service.rpc.removeThreads({ threadIds: input.positionals.threads }));
          const kept = input.positionals.threads.filter((threadId) => !removed.includes(threadId));
          const lines = [`Moved ${countText(removed.length)} out of their Space into Threads.`];
          if (kept.length > 0) lines.push(`Not in a Space, so left alone: ${kept.join(", ")}.`);
          return out(lines.join("\n"));
        },
      }),
      stop: cliCommand({
        summary: "Stop a section being a Space; the section and its threads stay where they are",
        positionals: [spacePositional],
        async run(input) {
          const space = await resolveSpace(service, input.positionals.space);
          await reported(() => service.rpc.stopSpace({ sectionId: space.sectionId }));
          return out(`"${space.name}" is no longer a Space. The section and its ${countText(space.memberCount)} stay where they are.`);
        },
      }),
    },
  });
}
