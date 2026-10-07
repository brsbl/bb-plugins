// The Spaces RPC contract. The server registers it; the app imports it with `import type` only.

import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

import { MEMBER_GROUPS } from "./shared";

const id = z.string().min(1).max(200);
const threadIds = z.array(id).min(1).max(100);

export const memberSchema = z
  .object({
    id,
    title: z.string(),
    projectId: z.string().nullable(),
    projectName: z.string().nullable(),
    group: z.enum(MEMBER_GROUPS),
    isUnread: z.boolean(),
    hasPendingInteraction: z.boolean(),
    failed: z.boolean(),
    running: z.boolean(),
    archived: z.boolean(),
    /** Epoch ms of the latest activity bb records for the thread. */
    lastActivityAt: z.number(),
    /** Latest agent message as one plain line, or null when the thread has no output yet. */
    excerpt: z.string().nullable(),
    /** First line of the thread's first prompt, shown muted when there is no output yet. */
    firstPrompt: z.string().nullable(),
    subthreads: z.object({ total: z.number(), working: z.number(), needsYou: z.number() }).strict(),
  })
  .strict();
export type SpaceMember = z.infer<typeof memberSchema>;

export const spaceSummarySchema = z
  .object({ sectionId: id, name: z.string(), memberCount: z.number() })
  .strict();
export type SpaceSummary = z.infer<typeof spaceSummarySchema>;

/** Whether Thread Organizer will hold a Space's finished members, so the panel can warn when it won't. */
export const organizerSupportSchema = z.enum(["absent", "supported", "outdated"]);
export type OrganizerSupport = z.infer<typeof organizerSupportSchema>;

export const spaceSnapshotSchema = z
  .object({
    sectionId: id,
    name: z.string(),
    /** Distinct project names across members, most members first. */
    projects: z.array(z.string()),
    members: z.array(memberSchema),
    organizer: organizerSupportSchema,
    /** Epoch ms when the server built this snapshot. */
    builtAt: z.number(),
  })
  .strict();
export type SpaceSnapshot = z.infer<typeof spaceSnapshotSchema>;

/** What the Space tab renders for one thread. */
export const panelStateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("member"), space: spaceSnapshotSchema }).strict(),
  z
    .object({
      kind: z.literal("outside"),
      /** The thread's current section, or null when it sits in the loose Threads list. */
      section: z
        .object({
          id,
          name: z.string(),
          /** False for Thread Organizer inboxes (Agent Inbox, Handoff, plugin inboxes). */
          eligible: z.boolean(),
          /** True when Thread Organizer has an entry prompt for this section; it pauses while the section is a Space. */
          hasEntryPrompt: z.boolean(),
        })
        .strict()
        .nullable(),
      /** Existing Spaces the thread could move into. */
      spaces: z.array(spaceSummarySchema),
      /** True when the thread is a subthread; subthreads follow their parent and can't join a Space alone. */
      isSubthread: z.boolean(),
    })
    .strict(),
]);
export type PanelState = z.infer<typeof panelStateSchema>;

export const candidateSchema = z
  .object({
    id,
    title: z.string(),
    projectName: z.string().nullable(),
    /** Current section name, or null for the loose Threads list. */
    sectionName: z.string().nullable(),
    /** Why it's suggested, e.g. "handed off from Plugins blog post"; null for plain search results. */
    reason: z.string().nullable(),
  })
  .strict();
export type Candidate = z.infer<typeof candidateSchema>;

export const tellResultSchema = z
  .object({ threadId: id, ok: z.boolean(), queued: z.boolean(), error: z.string().nullable() })
  .strict();
export type TellResult = z.infer<typeof tellResultSchema>;

export const spacesRpc = defineRpcContract({
  /** What the Space tab shows inside one thread. */
  panelState: {
    input: z.object({ threadId: id }).strict(),
    output: panelStateSchema,
  },
  /** One Space's full snapshot. */
  snapshot: {
    input: z.object({ sectionId: id }).strict(),
    output: spaceSnapshotSchema,
  },
  listSpaces: {
    input: z.null(),
    output: z.object({ spaces: z.array(spaceSummarySchema) }).strict(),
  },
  /** Read by Thread Organizer: which sections are Spaces right now. */
  listSpaceSectionIds: {
    input: z.null(),
    output: z.object({ sectionIds: z.array(id) }).strict(),
  },
  /** Mark an existing section as a Space. Rejects Thread Organizer inboxes. */
  makeSpace: {
    input: z.object({ sectionId: id }).strict(),
    output: spaceSummarySchema,
  },
  /** Create a new section as a Space, optionally moving threads into it. */
  createSpace: {
    input: z.object({ name: z.string().trim().min(1).max(120), threadIds: z.array(id).max(100).optional() }).strict(),
    output: spaceSummarySchema,
  },
  renameSpace: {
    input: z.object({ sectionId: id, name: z.string().trim().min(1).max(120) }).strict(),
    output: spaceSummarySchema,
  },
  /** Remove the marker. The section and its threads stay where they are. */
  stopSpace: {
    input: z.object({ sectionId: id }).strict(),
    output: z.object({ ok: z.literal(true) }).strict(),
  },
  /** Move top-level threads into the Space's section. Subthreads are skipped. */
  addThreads: {
    input: z.object({ sectionId: id, threadIds }).strict(),
    output: z.object({ added: z.array(id), skipped: z.array(id) }).strict(),
  },
  /** Move threads out of their Space into the loose Threads list. */
  removeThreads: {
    input: z.object({ threadIds }).strict(),
    output: z.object({ removed: z.array(id) }).strict(),
  },
  /** Send the same message, as the user, to each thread; running threads get it queued. */
  tell: {
    input: z.object({ threadIds, message: z.string().trim().min(1).max(20_000) }).strict(),
    output: z.object({ results: z.array(tellResultSchema) }).strict(),
  },
  /** Threads to offer in the Add threads picker. */
  candidates: {
    input: z.object({ sectionId: id, query: z.string().max(200).optional() }).strict(),
    output: z.object({ suggested: z.array(candidateSchema), others: z.array(candidateSchema) }).strict(),
  },
  /**
   * Bring a Space out of More (show) or put it back (hide). The server only hides a Space it brought out itself,
   * and it records that so every client agrees.
   */
  setSidebarVisibility: {
    input: z.object({ sectionId: id, show: z.boolean() }).strict(),
    output: z.object({ changed: z.boolean() }).strict(),
  },
});
export type SpacesRpc = typeof spacesRpc;
