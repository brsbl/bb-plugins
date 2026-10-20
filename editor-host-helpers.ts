// Moss's file rules for the host: moss-editor-host.js from the vendored
// @moss-multi/editor release (see vendor/moss-editor.provenance.json). The module
// is plain JavaScript; the release's contract.d.ts types it as MossEditorHostModule.
// @ts-expect-error The vendored module ships no declaration file of its own.
import * as vendored from "./vendor/moss-editor/moss-editor-host.js";
import type { MossEditorHostModule } from "./vendor/moss-editor.contract.js";

export const mossEditorHost: MossEditorHostModule = vendored;
