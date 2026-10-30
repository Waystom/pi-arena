import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createDiscountFixture, discountTask } from "../src/fixtures/discount.js";
import { evaluate } from "../src/fixtures/discount-evaluation.js";
import { mockAgents } from "../src/agents/mock-agents.js";
import { runArena } from "../src/engine.js";
import { renderReport } from "../src/viewer.js";

test("arena gives every contestant an isolated workspace and ranks by evidence", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "pi-arena-test-fixture-"));
  const output = path.join(fixture, "report.json");
  try {
    await createDiscountFixture(fixture);
    const report = await runArena({
      fixture,
      task: discountTask,
      contestants: Object.entries(mockAgents).map(([id, agent]) => ({ id, ...agent })),
      evaluate,
      output
    });
    assert.equal(report.schema, "picap-arena/v0");
    assert.equal(report.contestants.length, 3);
    assert.equal(report.contestants[0].id, "deepseek-flash");
    assert.equal(report.contestants[0].evaluation.score, 1);
    assert.ok(report.contestants.some((item) => item.evaluation.score < 1));
    assert.ok(report.contestants.every((item) => item.diff.some((entry) => entry.path === "src/discount.js")));
    assert.deepEqual(JSON.parse(await readFile(output, "utf8")).task, discountTask);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("viewer emits a standalone report containing the score table and timeline", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "pi-arena-viewer-"));
  try {
    const report = { task: discountTask, contestants: [{ label: "Example", id: "example", score: 80, durationMs: 12, diff: [{ path: "src/a.js" }], summary: "done", events: [{ kind: "edit", detail: "src/a.js", at: 2 }], evaluation: { passed: 1, total: 1, checks: [{ name: "works", pass: true, expected: 1, actual: 1 }] } }] };
    const output = path.join(fixture, "index.html");
    await renderReport(report, output);
    const html = await readFile(output, "utf8");
    assert.match(html, /Example/);
    assert.match(html, /src\/a\.js/);
    assert.match(html, /PI ARENA \/ REPLAY CONSOLE/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
