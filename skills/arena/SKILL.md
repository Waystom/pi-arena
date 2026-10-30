---
name: arena
description: Run fair, isolated comparisons between Pi coding agents on the same repository task, then produce objective tests, replay evidence, and a human-reviewable scorecard. Use when comparing models, providers, prompts, or agent strategies on a real coding task.
license: MIT
---

# Pi Arena

Turn a coding task into a reproducible tournament. Treat the task, starting revision, available tools, time budget, and evaluator as the competition contract.

Before running contestants:

1. Confirm the repository and starting revision. Do not run against an uncommitted working tree unless the user explicitly asks for it.
2. Ask for or derive an objective evaluator: tests, type checks, lint rules, or a user-supplied rubric. Keep hidden checks outside each contestant workspace.
3. Use the same prompt, model-independent tool policy, timeout, and environment for every contestant.
4. Never copy credentials into a worktree or report. Redact API keys, tokens, cookies, and private paths from captured output.

Run the arena through the installed CLI. The report must separate objective results from optional model-based judging. Never let an LLM score override a failing required test.

The report should include the base revision, contestant configuration, task prompt, tests run, pass/fail evidence, duration, cost when available, changed files, and a replayable timeline. If the run is not deterministic, label it as non-replayable instead of claiming reproducibility.

For human review, hide contestant names until the reviewer has inspected the diffs. Ask the reviewer to assess correctness, scope, maintainability, and clarity separately from the automated score.
