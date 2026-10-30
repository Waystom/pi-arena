#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import { createDiscountFixture, discountTask } from "./fixtures/discount.js";
import { evaluate } from "./fixtures/discount-evaluation.js";
import { mockAgents } from "./agents/mock-agents.js";
import { runArena } from "./engine.js";
import { renderReport } from "./viewer.js";
import { piRpcContestant } from "./adapters/pi-rpc.js";

const args = process.argv.slice(2);
const command = args[0] ?? "help";
const value = (flag, fallback) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : fallback; };

function usage() {
  console.log(`pi-arena 0.1.0\n\nCommands:\n  demo                         Run the built-in fair-play tournament\n  run                          Run real Pi RPC contestants\n  render <report.json>         Render a report as a standalone HTML file\n  help                         Show this help\n\nRun example:\n  pi-arena run --workspace . --task task.md --evaluation ./evaluation.mjs \\\n    --models deepseek/deepseek-flash,openai/gpt-5`);
}

if (command === "help") usage();
else if (command === "render") {
  const input = args[1];
  if (!input) throw new Error("Usage: pi-arena render <report.json> [--output report.html]");
  const report = JSON.parse(await readFile(input, "utf8"));
  const output = value("--output", input.replace(/\.json$/u, ".html"));
  await renderReport(report, output);
  console.log(`Rendered ${output}`);
} else if (command === "demo") {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "pi-arena-fixture-"));
  const outputDir = path.resolve(value("--output-dir", "./arena-demo"));
  await mkdir(outputDir, { recursive: true });
  try {
    await createDiscountFixture(fixture);
    const reportPath = path.join(outputDir, "arena.json");
    const report = await runArena({
      fixture,
      task: discountTask,
      contestants: Object.entries(mockAgents).map(([id, agent]) => ({ id, ...agent })),
      evaluate,
      output: reportPath
    });
    const htmlPath = path.join(outputDir, "index.html");
    await renderReport(report, htmlPath);
    console.log(`Winner: ${report.contestants[0].label} (${report.contestants[0].score})`);
    console.log(`Report: ${reportPath}`);
    console.log(`Replay viewer: ${htmlPath}`);
  } finally {
    const { rm } = await import("node:fs/promises");
    await rm(fixture, { recursive: true, force: true });
  }
} else if (command === "run") {
  const workspace = path.resolve(value("--workspace", process.cwd()));
  const taskFile = value("--task");
  const evaluationFile = value("--evaluation");
  const models = value("--models", "deepseek/deepseek-flash").split(",").map((item) => item.trim()).filter(Boolean);
  if (!taskFile || !evaluationFile) throw new Error("Usage: pi-arena run --workspace . --task task.md --evaluation ./evaluation.mjs --models provider/model,...");
  const taskPrompt = await readFile(path.resolve(taskFile), "utf8");
  const evaluation = await import(pathToFileURL(path.resolve(evaluationFile)).href);
  if (typeof evaluation.evaluate !== "function") throw new Error("Evaluation module must export async function evaluate({ workspace, task })");
  const output = path.resolve(value("--output", "arena.json"));
  const report = await runArena({
    fixture: workspace,
    task: { id: path.basename(taskFile), prompt: taskPrompt },
    contestants: models.map((model) => piRpcContestant({ id: model, label: model, model, timeoutMs: Number(value("--timeout", 600_000)) })),
    evaluate: evaluation.evaluate,
    output
  });
  const htmlPath = path.resolve(value("--html", output.replace(/\.json$/u, ".html")));
  await renderReport(report, htmlPath);
  console.log(`Winner: ${report.contestants[0]?.label ?? "none"} (${report.contestants[0]?.score ?? 0})`);
  console.log(`Report: ${output}`);
  console.log(`Replay viewer: ${htmlPath}`);
} else {
  usage();
  process.exitCode = 1;
}
