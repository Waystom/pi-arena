import { spawn } from "node:child_process";

function parseRecordLines(onRecord) {
  let buffer = "";
  return (chunk) => {
    buffer += chunk.toString("utf8");
    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).replace(/\r$/u, "");
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      try { onRecord(JSON.parse(line)); } catch { /* Pi diagnostics never enter stdout. */ }
    }
  };
}

/**
 * Build a contestant backed by a real Pi RPC process. The runner owns the
 * workspace and evaluator; this adapter only speaks Pi's documented JSONL
 * protocol and records the observable session events.
 */
export function piRpcContestant({ id, label = id, model, piCommand = "pi", timeoutMs = 10 * 60_000 }) {
  return {
    id,
    label,
    async solve({ workspace, task, emit }) {
      const args = ["--mode", "rpc", "--no-session", "--model", model];
      const child = spawn(piCommand, args, { cwd: workspace, stdio: ["pipe", "pipe", "pipe"] });
      let settled = false;
      let stderr = "";
      const finish = (resolve, reject, error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        child.stdin.end();
        if (error) reject(error); else resolve();
      };
      const completion = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          child.kill("SIGTERM");
          finish(resolve, reject, new Error(`Pi RPC timed out after ${timeoutMs} ms`));
        }, timeoutMs);
        child.on("error", (error) => finish(resolve, reject, error));
        child.on("exit", (code, signal) => {
          if (!settled && code !== 0) finish(resolve, reject, new Error(`Pi RPC exited with ${code ?? signal}: ${stderr.trim()}`));
          else finish(resolve, reject);
        });
        child.stdout.on("data", parseRecordLines((record) => {
          emit(record.type ?? "rpc", summarizeRecord(record));
          if (record.type === "agent_settled") finish(resolve, reject);
        }));
        child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8").slice(0, 4000); });
        child.stdin.write(JSON.stringify({ id: "arena-prompt", type: "prompt", message: task.prompt }) + "\n");
      });
      await completion;
      return { summary: `Completed Pi RPC run with ${model}.` };
    }
  };
}

function summarizeRecord(record) {
  if (record.type === "message_update") {
    const event = record.assistantMessageEvent;
    return event?.type === "text_delta" ? `text: ${redact(event.delta)}` : event?.type ?? "message update";
  }
  if (record.type === "tool_execution_start") return `tool: ${record.toolName ?? record.toolCallId ?? "unknown"}`;
  if (record.type === "tool_execution_end") return `tool finished: ${record.toolName ?? record.toolCallId ?? "unknown"}`;
  if (record.type === "agent_end") return "agent run ended";
  if (record.type === "agent_settled") return "agent settled";
  return record.command ?? record.type ?? "event";
}

function redact(value) {
  return String(value ?? "")
    .replace(/(sk-[A-Za-z0-9_-]{12,})/gu, "[REDACTED_KEY]")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/giu, "$1[REDACTED]")
    .slice(0, 500);
}
