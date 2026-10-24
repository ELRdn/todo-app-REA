// Evaluate tools/page-audit.js in a live CDP target and persist the raw result.
// usage: node tools/extract.mjs <targetId> <out.json>
import fs from "node:fs";

const PORT = process.env.PORT || "9223";
const [targetId, out] = process.argv.slice(2);
const expression = fs.readFileSync(new URL("./page-audit.js", import.meta.url), "utf8");

const ws = new WebSocket(`ws://127.0.0.1:${PORT}/devtools/page/${targetId}`);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++seq; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
if (r.result?.exceptionDetails) {
  console.error(JSON.stringify(r.result.exceptionDetails, null, 2));
  process.exit(1);
}
const value = r.result.result.value;
fs.writeFileSync(out, JSON.stringify(value, null, 2));
console.log(JSON.stringify({
  out,
  url: value.url,
  title: value.title,
  viewport: value.viewport,
  topFont: value.palette.fontFamily[0],
  topTextColors: value.palette.text.slice(0, 5),
  topBg: value.palette.background.slice(0, 5),
  cssVars: Object.keys(value.cssVariables).length,
  buttons: value.buttons.length,
  headings: value.headings.length,
}));
ws.close();
