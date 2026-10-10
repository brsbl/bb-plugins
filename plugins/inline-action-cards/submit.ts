import type { ExperimentalComposerSubmitOptions, PluginComposerApi } from "@get-bb/plugin-sdk/app";

// Several cards may share one composer. A double click must never submit two drafts.
export const submitting = new Set<string>();
export const readableError = (error: unknown) => error instanceof Error ? error.message : "The card could not be updated. Try again.";
// The host reports accepted submissions, including queued ones; older hosts only clear the draft.
export async function submitDraft(composer: PluginComposerApi, options: ExperimentalComposerSubmitOptions): Promise<boolean> {
  const submittedText = composer.text;
  let accepted = false;
  const stop = composer.experimental_onSubmitted?.(() => { accepted = true; });
  try { await composer.experimental_submit(options); } finally { stop?.(); }
  return accepted || composer.text !== submittedText;
}

