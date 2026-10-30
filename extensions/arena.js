/**
 * Small Pi-facing entry point. The scoring engine remains outside the model
 * process so the model cannot change its own evaluation rules.
 */
export default function arenaExtension(pi) {
  pi.registerCommand("arena", {
    description: "Show Pi Arena commands and fairness rules",
    handler: async (_args, ctx) => {
      ctx.ui.notify("Pi Arena: use `pi-arena demo` for a local tournament, or read skills/arena/SKILL.md before running real contestants.", "info");
    }
  });
}
