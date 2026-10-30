import { writeFile } from "node:fs/promises";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export async function renderReport(report, output) {
  const payload = JSON.stringify(report).replace(/</g, "\\u003c");
  const rows = report.contestants.map((item, index) => `<tr><td>${index + 1}</td><td><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.id)}</small></td><td>${item.score}</td><td>${item.evaluation.passed}/${item.evaluation.total}</td><td>${item.durationMs} ms</td><td>${item.diff.length}</td></tr>`).join("");
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pi Arena — ${escapeHtml(report.task.id)}</title>
<style>
body{margin:0;background:#0d1117;color:#e6edf3;font:15px system-ui,sans-serif}main{max-width:1100px;margin:0 auto;padding:32px}h1{font-size:32px;margin:0 0 8px}.muted,small{color:#8b949e}table{width:100%;border-collapse:collapse;margin:24px 0;background:#161b22;border-radius:12px;overflow:hidden}th,td{text-align:left;padding:14px;border-bottom:1px solid #30363d}th{color:#8b949e;font-weight:500}small{display:block;margin-top:3px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:18px}.card h2{margin:0 0 12px;font-size:19px}.event{padding:8px 0;border-bottom:1px solid #21262d}.pill{display:inline-block;border-radius:999px;padding:3px 9px;background:#1f6feb;color:white;font-size:12px}.pass{color:#3fb950}.fail{color:#f85149}pre{white-space:pre-wrap;background:#0d1117;padding:12px;border-radius:8px;overflow:auto}
</style><main><div class="muted">PI ARENA / REPLAY REPORT</div><h1>${escapeHtml(report.task.id)}</h1><p>${escapeHtml(report.task.prompt)}</p><table><thead><tr><th>#</th><th>Contestant</th><th>Score</th><th>Tests</th><th>Time</th><th>Files changed</th></tr></thead><tbody>${rows}</tbody></table><div class="grid" id="details"></div></main>
<script>const report=${payload};const details=document.querySelector('#details');for(const c of report.contestants){const checks=c.evaluation.checks.map(x=>'<div class="event '+(x.pass?'pass':'fail')+'">'+(x.pass?'✓':'✗')+' '+x.name+' <span class="muted">expected '+JSON.stringify(x.expected)+', got '+JSON.stringify(x.actual)+'</span></div>').join('');const events=c.events.map(x=>'<div class="event"><span class="pill">'+x.kind+'</span> '+x.detail+' <span class="muted">+'+x.at+'ms</span></div>').join('');details.insertAdjacentHTML('beforeend','<section class="card"><h2>'+c.label+' — '+c.score+'</h2><p>'+c.summary+'</p><h3>Evaluation</h3>'+checks+'<h3>Timeline</h3>'+events+'<h3>Changed files</h3><pre>'+c.diff.map(x=>x.path).join('\\n')+'</pre></section>')}</script>`;
  await writeFile(output, html);
}
