# pi-arena

**AI coding agent Olympics for Pi.** Run the same task in isolated workspaces, score the result with tests and measurable signals, and replay the work in a shareable browser report.

Pi Arena is designed for fair comparisons between models, providers, prompts, and agent strategies. It is not an LLM judge disguised as a benchmark: required tests are objective, model-based judging is optional, and every score links back to evidence.

## Demo

This repository includes a deterministic local tournament so the demo works without an API key:

```bash
source "$HOME/.nvm/nvm.sh"   # if Node was installed with nvm
cd pi-arena
npm run demo
```

Open `arena-demo/index.html` in a browser. Three local contestants receive the same discount-rule task. One solves it correctly, one makes a boundary mistake, and one overfits the visible example. The replay console turns the run into a small race: press **Replay race**, watch each lane advance, select a contestant, and inspect its action timeline and evaluation checks.

The demo is deliberately deterministic. It lets contributors test the evaluator and viewer without spending money or depending on a model provider.

中文文档：[`SKILL_USAGE.md`](./SKILL_USAGE.md) · [`COMPARISON.md`](./COMPARISON.md)

## Why this is a Pi package

The `skills/arena/SKILL.md` file gives Pi the tournament protocol: equal starting state, isolated workspaces, objective evaluation, secret redaction, and blind human review. The runner is separate from the skill because fairness and scoring must be enforced by code rather than trusted to the model.

The next adapter will start Pi through its JSONL RPC interface, so each contestant can be a real Pi process using a different provider/model:

```text
pi-arena run task.md --models deepseek/deepseek-flash,openai/gpt-5 --tests ./evaluation
```

The adapter will record accepted prompts, session events, tool calls, tool results, duration, and usage. The same evaluator will score every workspace.

## Scoring contract

The demo score is intentionally simple:

- 70% required evaluation checks;
- 20% efficiency based on recorded actions;
- 10% scope discipline, including avoiding test edits.

Real projects should define their own weights in a versioned evaluation file. Scores are only comparable when the task, starting revision, evaluator, and budget are identical.

## Design boundaries

- The first release targets local Node.js fixtures and Linux/macOS development environments.
- A score is not proof of overall software quality; it is evidence for the declared evaluator.
- Network access, credentials, and destructive commands require explicit user policy. The runner must fail closed when the requested isolation cannot be established.
- Pi Arena does not claim that one model is universally best. It reports what happened on a stated task under a stated budget.

## Roadmap

1. Pi JSONL RPC contestant adapter.
2. Git worktree isolation with a clean starting commit.
3. Pluggable evaluators for `npm test`, `pytest`, type checking, and custom scripts.
4. Blind human review mode and signed report manifests.
5. GitHub Action that publishes a static arena report and a README badge.
6. An open report schema so other agent runtimes can join the arena.

## License

MIT
