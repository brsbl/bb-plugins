// Moss's file rules for the host, from @moss-multi/editor-host (vendored from the
// editor-v0.0.1 release; see vendor/moss-editor-host.provenance.json). The module is
// plain JavaScript; its contract.d.ts types it as MossEditorHostModule.
// @ts-expect-error The vendored module ships no declaration file of its own.
import * as vendored from "./vendor/moss-editor-host/moss-editor-host.js";
import type { MossEditorHostModule } from "./vendor/moss-editor-host/contract.js";

export const mossEditorHost: MossEditorHostModule = vendored;
