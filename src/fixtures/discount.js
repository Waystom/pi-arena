import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function createDiscountFixture(root) {
  await mkdir(path.join(root, "src"), { recursive: true });
  await writeFile(path.join(root, "src", "discount.js"), [
    "export function finalPrice(subtotal) {",
    "  if (subtotal < 0) throw new Error('subtotal must be non-negative');",
    "  return subtotal * 0.9;",
    "}",
    ""
  ].join("\n"));
  await writeFile(path.join(root, "README.md"), "# Discount fixture\n\nThe task is to apply a 10% discount only when subtotal is at least 100.\n");
}

export const discountTask = {
  id: "discount-threshold",
  prompt: "Fix finalPrice so that the 10% discount applies only when subtotal is at least 100. Preserve rejection of negative subtotals.",
  evaluation: "fixtures/discount-evaluation.js"
};
