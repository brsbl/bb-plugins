# Doctrine evals

Five held-out design tasks for checking that the doctrine still steers work the
way it should. Maintenance never edits this file; a scenario changes only by a
deliberate, reviewed revision.

## How to run

1. Give a fresh agent only the **Task** line, with Design Doctrine available
   and no access to this file.
2. Compare its output with **Should apply**, **Should not apply**, and
   **Passes when**. A scenario passes when every "Passes when" item holds and
   no "Should not apply" rule drives a decision.
3. Report each scenario as pass or fail with the item that failed. A failure
   after a rule change points at that change.

For a quick check after a maintenance pass, confirm every rule listed under
"Should apply" is still active and in scope for its task, and that no new or
narrowed rule would change the passing output.

## 1. Dense header toolbar

- **Task:** Redesign a thread header toolbar that has Refresh, Open logs, Copy
  link, Archive, and a primary Run action.
- **Should apply:** ddr_001, ddr_040, ext_001, ext_002.
- **Should not apply:** ddr_005 (nothing is empty).
- **Passes when:**
  - Refresh, Open logs, and Copy link are icon-only with accessible names and
    tooltips that show their shortcuts; Run keeps a text label.
  - Archive is labeled or recoverable rather than an unexplained icon.
  - Peer controls share one visible-edge gap and equal icon sizes.
  - Every target is at least 24 by 24 CSS pixels.

## 2. Empty list with a blocked action

- **Task:** A Plugins panel has no installed plugins, and its Update all action
  cannot run while offline. Design both states.
- **Should apply:** ddr_005, ddr_039, ddr_036.
- **Should not apply:** ext_003 (nothing is being confirmed or undone).
- **Passes when:**
  - The empty list collapses, or shows one compact explanation and its first
    useful action, with no placeholder card.
  - Update all stays in place, disabled, with the offline reason and how to
    recover.

## 3. Supervising a risky agent run

- **Task:** Design the UI for an agent about to edit 40 files and run a
  database migration while the user works elsewhere.
- **Should apply:** ext_004, ext_005, ext_007, ext_003, ext_009.
- **Should not apply:** ddr_001 (the job is oversight, not toolbar density).
- **Passes when:**
  - The plan is shown before work starts, and only the migration needs
    approval.
  - Pause, stop, and steer stay visible while it runs, beside a readable action
    stream.
  - Notifications fire only for needed input, failure, or completion.
  - After a reload the run shows its true state, and the approval button reads
    Run migration rather than OK.

## 4. Claiming a hover-card fix is done

- **Task:** Fix a comment hover card that disappears when the pointer moves
  onto it, then report the fix.
- **Should apply:** ddr_031, ddr_028, ext_001.
- **Should not apply:** ddr_035 (no design decision is being requested).
- **Passes when:**
  - The report includes a current rendered capture of the hover and keyboard
    focus states.
  - The card stays open while hovered, is dismissible without moving the
    pointer, and is reachable by keyboard.
  - Observed behavior is reported separately from what the code implies.

## 5. Reorderable list with delete

- **Task:** Add drag-to-reorder and delete to a saved-prompts list.
- **Should apply:** ddr_019, ext_001, ddr_008, ext_003, ddr_028.
- **Should not apply:** ddr_014 (the list has no filters or facets).
- **Passes when:**
  - The drag handle only drags, and keyboard or single-click move actions reach
    the same order.
  - Revealing the handle or row actions does not shift the row.
  - Delete runs immediately with undo instead of a confirmation dialog.
