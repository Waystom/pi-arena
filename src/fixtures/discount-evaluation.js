import { pathToFileURL } from "node:url";

export async function evaluate({ workspace }) {
  const moduleUrl = pathToFileURL(`${workspace}/src/discount.js`).href + `?run=${Date.now()}`;
  const { finalPrice } = await import(moduleUrl);
  const checks = [];
  const check = (name, pass, expected, actual) => checks.push({ name, pass, expected, actual });
  check("100 gets the discount", finalPrice(100) === 90, 90, finalPrice(100));
  check("120 gets the discount", finalPrice(120) === 108, 108, finalPrice(120));
  check("99 gets no discount", finalPrice(99) === 99, 99, finalPrice(99));
  check("0 stays zero", finalPrice(0) === 0, 0, finalPrice(0));
  let rejected = false;
  try { finalPrice(-1); } catch { rejected = true; }
  check("negative subtotals are rejected", rejected, true, rejected);
  const passed = checks.filter((item) => item.pass).length;
  return { checks, passed, total: checks.length, score: passed / checks.length };
}
