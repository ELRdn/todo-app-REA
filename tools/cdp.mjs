// Minimal CDP driver used to operate a local headless Chrome during the REA UI study.
// Usage: node tools/cdp.mjs <command> ...
import fs from "node:fs";

const PORT = process.env.PORT || "9223";
const HOST = `http://127.0.0.1:${PORT}`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";

const cmd = process.argv[2];
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, opts) {
  const r = await fetch(HOST + path, opts);
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function connect(id) {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/devtools/page/${id}`);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++seq; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.bringToFront").catch(() => {});
  return { ws, send };
}

async function setUa(send) {
  await send("Emulation.setUserAgentOverride", {
    userAgent: UA,
    acceptLanguage: "en-US,en;q=0.9",
    platform: "Win32",
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 960, deviceScaleFactor: 1, mobile: false,
  });
}

async function shot(id, out, mode) {
  const { ws, send } = await connect(id);
  let clip;
  if (mode === "full") {
    const m = await send("Page.getLayoutMetrics");
    const cs = m.result.cssContentSize || m.result.contentSize;
    clip = { x: 0, y: 0, width: Math.ceil(cs.width), height: Math.ceil(cs.height), scale: 1 };
  }
  const r = await send("Page.captureScreenshot", {
    format: "png", captureBeyondViewport: mode === "full", clip, fromSurface: true,
  });
  const buf = Buffer.from(r.result.data, "base64");
  fs.writeFileSync(out, buf);
  console.log(JSON.stringify({ out, bytes: buf.length }));
  ws.close();
}

if (cmd === "list") {
  const t = await api("/json/list");
  console.log(JSON.stringify(t.filter((x) => x.type === "page").map((x) => ({ id: x.id, url: x.url, title: x.title })), null, 2));
} else if (cmd === "new") {
  const url = process.argv[3];
  const wait = Number(process.argv[4] || 5000);
  const t = await api("/json/new?about:blank", { method: "PUT" });
  const { ws, send } = await connect(t.id);
  await setUa(send);
  await send("Page.navigate", { url });
  await delay(wait);
  console.log(JSON.stringify({ id: t.id, url, wait }));
  ws.close();
} else if (cmd === "nav") {
  const [id, url] = process.argv.slice(3);
  const wait = Number(process.argv[5] || 5000);
  const { ws, send } = await connect(id);
  await setUa(send);
  await send("Page.navigate", { url });
  await delay(wait);
  console.log(JSON.stringify({ id, url }));
  ws.close();
} else if (cmd === "eval") {
  const [id, expr] = process.argv.slice(3);
  const { ws, send } = await connect(id);
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  console.log(JSON.stringify(r.result, null, 2));
  ws.close();
} else if (cmd === "shot") {
  await shot(process.argv[3], process.argv[4], process.argv[5]);
} else if (cmd === "clipshot") {
  const [id, out, y, h] = process.argv.slice(3);
  const { ws, send } = await connect(id);
  const r = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: Number(y), width: 1440, height: Number(h || 900), scale: 1 },
    fromSurface: true,
  });
  const buf = Buffer.from(r.result.data, "base64");
  fs.writeFileSync(out, buf);
  console.log(JSON.stringify({ out, bytes: buf.length }));
  ws.close();
} else if (cmd === "scroll") {
  const [id, y] = process.argv.slice(3);
  const { ws, send } = await connect(id);
  await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${Number(y)}); "ok"`, returnByValue: true });
  await delay(1200);
  console.log("scrolled");
  ws.close();
} else if (cmd === "close") {
  await fetch(`${HOST}/json/close/${process.argv[3]}`);
  console.log("closed");
} else {
  console.log("usage: list | new <url> [waitMs] | nav <id> <url> [waitMs] | eval <id> <expr> | shot <id> <out> [full] | scroll <id> <y> | close <id>");
}
