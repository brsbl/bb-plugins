// Several cards may target one thread. A double click must never send two messages.
export const submitting = new Set<string>();
export const readableError = (error: unknown) => error instanceof Error ? error.message : "The card could not be updated. Try again.";
