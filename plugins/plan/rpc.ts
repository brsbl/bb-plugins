import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import {
  investmentAddInput, investmentEditInput, objectiveAddInput, objectiveApproveInput, objectiveAssignInput, objectiveEditInput, openRecordInput,
  priorityAddInput, priorityEditInput, showInput,
  type Investment, type Objective, type OpenRecord, type Overview, type Priority,
} from "./model.js";
import type { OrgGroup } from "./components/view-model.js";
import type { ActiveStart } from "./start.js";

export const CHANGED = "changed";

export type Outcome<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

export interface Snapshot extends Overview { orgs: OrgGroup[]; starts: ActiveStart[] }
export interface ThreadOption { id: string; name: string }

const outcome = <T>() => z.custom<Outcome<T>>();

export const rpcContract = defineRpcContract({
  snapshot: { input: z.strictObject({}), output: z.custom<Snapshot>() },
  addPriority: { input: priorityAddInput, output: outcome<Priority>() },
  editPriority: { input: priorityEditInput, output: outcome<Priority>() },
  addObjective: { input: objectiveAddInput, output: outcome<Objective>() },
  editObjective: { input: objectiveEditInput, output: outcome<Objective>() },
  approveObjective: { input: objectiveApproveInput, output: outcome<Objective>() },
  assignObjective: { input: objectiveAssignInput, output: outcome<Objective>() },
  addInvestment: { input: investmentAddInput, output: outcome<Investment>() },
  editInvestment: { input: investmentEditInput, output: outcome<Investment>() },
  startInvestment: { input: showInput, output: outcome<Investment>() },
  searchThreads: { input: z.strictObject({ query: z.string().max(200) }), output: z.custom<{ threads: ThreadOption[] }>() },
  openRecord: { input: openRecordInput, output: z.custom<{ threadId: string; record: OpenRecord | null }>() },
});
export type RpcContract = typeof rpcContract;
