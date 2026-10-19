# Playgrounds evals

`spec.json` is a fixed set of 10 requests a product builder might make, each with
a follow-up, and a 7-item rubric. None of the prompts name Playgrounds or Anatomy,
so the eval measures whether agents choose a playground, pick the right form, and
build something correct and operable on their own.

## Run it

1. Start an isolated bb dev app with this plugin installed from a path.
2. For each prompt, run 3 fresh threads, each in a new project backed by its own
   empty git repo. Send the prompt verbatim, wait for the turn to end, then send
   the follow-up verbatim in the same thread.
3. Keep each card open in a browser while its follow-up runs, so the agent can
   drive it with `bb playgrounds do`.
4. Grade every run pass, fail or n/a on each rubric item, with one line of
   evidence. Score and consistency follow `scoring` in the spec.

Don't add these prompts' topics to the skill, guide or references: that would
teach to the test.

## Results

| Run | Build | Mean | Consistent prompts |
| --- | --- | --- | --- |
| [Baseline](2026-10-15-baseline.md) | 1ff4125f (#443 before the quality work) | 0.76 | 6/10 |
| [Shipped](2026-10-15-shipped-4d3fd6f3.md) | 4d3fd6f3 (#443 + #460 merged) | 0.79 | 9/10 |

The result files mention per-run screenshots and transcripts that were not kept.
