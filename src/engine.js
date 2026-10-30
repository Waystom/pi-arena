import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

async function copyWorkspace(source, parent, name) {
  const workspace = path.join(parent, name);
  await cp(source, workspace, { recursive: true });
  return workspace;
}

async function snapshot(root) {
  const files = {};
  async function visit(dir) {
    const entries = await (await import("node:fs/promises")).readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else files[path.relative(root, full)] = (await readFile(full)).toString("base64");
    }
  }
  await visit(root);
  return files;
}

function diffFiles(before, after) {
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...names].filter((name) => before[name] !== after[name]).map((name) => ({
    path: name,
    before: before[name] ?? null,
    after: after[name] ?? null
  }));
}

export async function runArena({ fixture, task, contestants, evaluate, output }) {
  const root = await mkdtemp(path.join(os.tmpdir(), "pi-arena-"));
  const startedAt = new Date().toISOString();
  const results = [];
  try {
    for (const contestant of contestants) {
      const workspace = await copyWorkspace(fixture, root, contestant.id);
      const before = await snapshot(workspace);
      const events = [];
      const started = performance.now();
      let status = "completed";
      let summary = "";
      let error;
      try {
        const result = await contestant.solve({
          workspace,
          task,
          emit: (kind, detail) => events.push({ at: Math.round(performance.now() - started), kind, detail })
        });
        summary = result?.summary ?? "";
      } catch (cause) {
        status = "failed";
        error = cause instanceof Error ? cause.message : String(cause);
      }
      let evaluation;
      try { evaluation = await evaluate({ workspace, task }); }
      catch (cause) { evaluation = { checks: [], passed: 0, total: 0, score: 0, error: String(cause) }; }
      const after = await snapshot(workspace);
      const diff = diffFiles(before, after);
      const durationMs = Math.round(performance.now() - started);
      const efficiency = Math.max(0, 1 - Math.min(events.length / 12, 1));
      const scope = diff.some((item) => item.path.startsWith("tests/")) ? 0 : 1;
      const score = Math.round((evaluation.score * 70 + efficiency * 20 + scope * 10) * 100) / 100;
      results.push({ id: contestant.id, label: contestant.label, status, summary, error, events, evaluation, diff, durationMs, score });
      await rm(workspace, { recursive: true, force: true });
    }
    results.sort((a, b) => b.score - a.score);
    const report = { schema: "picap-arena/v0", startedAt, task, contestants: results };
    await writeFile(output, JSON.stringify(report, null, 2));
    return report;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
