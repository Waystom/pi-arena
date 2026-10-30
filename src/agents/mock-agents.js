import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const target = (workspace) => path.join(workspace, "src", "discount.js");

export const mockAgents = {
  "deepseek-flash": {
    label: "DeepSeek Flash",
    async solve({ workspace, emit }) {
      emit("thought", "Read the pricing rule and inspect the existing tests.");
      const file = target(workspace);
      const source = await readFile(file, "utf8");
      emit("read", "src/discount.js");
      const updated = source.replace("return subtotal * 0.9;", "return subtotal >= 100 ? subtotal * 0.9 : subtotal;");
      await writeFile(file, updated);
      emit("edit", "src/discount.js");
      emit("command", "node --test");
      return { summary: "Implemented the threshold and preserved the low-value case." };
    }
  },
  "fast-fix": {
    label: "Fast Fix",
    async solve({ workspace, emit }) {
      emit("thought", "Apply the obvious discount rule quickly.");
      const file = target(workspace);
      const source = await readFile(file, "utf8");
      emit("read", "src/discount.js");
      await writeFile(file, source.replace("return subtotal * 0.9;", "return subtotal >= 100 ? subtotal * 0.9 : subtotal - 1;"));
      emit("edit", "src/discount.js");
      return { summary: "Applied a quick threshold fix." };
    }
  },
  "overfit-bot": {
    label: "Overfit Bot",
    async solve({ workspace, emit }) {
      emit("thought", "Make the visible example pass.");
      const file = target(workspace);
      const source = await readFile(file, "utf8");
      emit("read", "src/discount.js");
      await writeFile(file, source.replace("return subtotal * 0.9;", "return subtotal === 120 ? 108 : subtotal * 0.9;"));
      emit("edit", "src/discount.js");
      return { summary: "Matched the example case." };
    }
  }
};
