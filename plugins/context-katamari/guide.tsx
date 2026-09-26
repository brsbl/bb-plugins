import { memo, useState } from "react";

const GUIDE_SEEN_KEY = "context-katamari:guide-seen";

export function guideSeen(): boolean {
  try {
    return window.localStorage.getItem(GUIDE_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

/** Once closed, the guide stops opening on its own. */
export function markGuideSeen(): void {
  try {
    window.localStorage.setItem(GUIDE_SEEN_KEY, "true");
  } catch {
    // The guide simply shows again next time.
  }
}

/** What the cousin and the world do, and what each one says about the thread. */
const GUIDE_EVENTS = [
  ["🏃", "Rolling on his own", "the thread is working"],
  ["🧍", "Standing still", "idle, or waiting for you"],
  ["💥", "GULP and a shake", "one turn swallowed a lot"],
  ["🪙", "Coin trail", "past 50k, every turn re-reads it all"],
  ["🎈", "POP, the ball shrinks", "the thread compacted"],
  ["💫", "Dizzy cousin", "woozier with each compaction"],
] as const;

/**
 * The help screen, in two pages the way a game's tutorial runs: labels over
 * each part of the HUD, then what the cousin's antics mean.
 */
export const Guide = memo(function Guide({ onClose }: { onClose(): void }) {
  const [page, setPage] = useState<"hud" | "events">("hud");
  const nav = (
    <div className="ck-guide-actions">
      <button
        type="button"
        className="ck-guide-arrow"
        aria-label="Previous page"
        disabled={page === "hud"}
        onClick={() => setPage("hud")}
      >
        ‹
      </button>
      <span className="ck-guide-dots" aria-hidden="true">
        <span data-on={page === "hud"} />
        <span data-on={page === "events"} />
      </span>
      <button
        type="button"
        className="ck-guide-arrow"
        aria-label="Next page"
        disabled={page === "events"}
        onClick={() => setPage("events")}
      >
        ›
      </button>
      {page === "events" ? (
        <button type="button" className="ck-guide-close" onClick={onClose}>
          Got it
        </button>
      ) : null}
    </div>
  );
  return (
    <div className="ck-guide" data-page={page} role="dialog" aria-label="What everything means">
      {page === "hud" ? (
        <>
          <span className="ck-guide-label" data-spot="size">↑ Size · tokens used / max</span>
          <span className="ck-guide-label" data-spot="clock">↑ Context left</span>
          <span className="ck-guide-label" data-spot="turns">Each turn's context ↑</span>
          <span className="ck-guide-label" data-spot="item">← Last thing the ball picked up</span>
          <span className="ck-guide-label" data-spot="stars">Times compacted ↗</span>
          <div className="ck-guide-card">
            <p>The ball grows as this thread fills its context. At the limit, bb compacts it: POP!</p>
            <p className="ck-guide-keys">Click, then roll with the arrow keys.</p>
            {nav}
          </div>
        </>
      ) : (
        <div className="ck-guide-card" data-page="events">
          <ul className="ck-guide-events">
            {GUIDE_EVENTS.map(([icon, sight, meaning]) => (
              <li key={sight}>
                <span aria-hidden="true">{icon}</span>
                <span>
                  <b>{sight}</b> {meaning}
                </span>
              </li>
            ))}
          </ul>
          {nav}
        </div>
      )}
    </div>
  );
});
