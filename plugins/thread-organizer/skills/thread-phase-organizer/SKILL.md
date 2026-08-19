---
name: thread-phase-organizer
description: Keep the current bb thread in the development-phase section that matches its present work. Use when an agent starts planning, reviews a spec, begins implementation, prepares a handoff, tests or deploys, changes phases, or cannot confidently identify the phase.
---

# Thread Phase Organizer

Move your own bb thread when its primary work changes phase. Run one command from the thread so `BB_THREAD_ID` targets the current thread:

```bash
bb organizer phase <phase>
```

Choose the phase from the work you are doing now, not the overall project or an earlier turn:

| Phase               | Use while                                                                      | Command                             |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| 📥 Inbox            | The phase is unclear, mixed, blocked before work starts, or awaiting direction | `bb organizer phase inbox`          |
| 📋 Planning         | Discovering, scoping, designing an approach, or writing requirements           | `bb organizer phase planning`       |
| 🔎 Spec Review      | Reviewing, critiquing, approving, or revising a spec or implementation plan    | `bb organizer phase spec-review`    |
| 🛠️ Building         | Implementing, debugging, refactoring, or changing code and artifacts           | `bb organizer phase building`       |
| ✅ Testing / Deploy | Running QA, tests, CI, release checks, shipping, or deploying                  | `bb organizer phase testing-deploy` |
| 🤝 Handoff          | Packaging state and evidence for another agent or owner to continue            | `bb organizer phase handoff`        |

Move at the transition, before beginning the new phase. A return from testing to implementation is `building`; a revised plan awaiting approval is `spec-review`; accepted review followed by code changes is `building`. When two phases overlap, choose the one containing the next concrete action. If that is still unclear, use Inbox rather than guessing.

Do not create, rename, or delete the sections yourself. The plugin creates destinations on demand and retains empty sections until BB exposes an atomic delete-if-empty operation.
