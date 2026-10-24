// Build evidence/gallery.html from evidence/manifest.json
import fs from "node:fs";

const m = JSON.parse(fs.readFileSync("evidence/manifest.json", "utf8"));
const groups = new Map();
for (const s of m.screenshots) {
  const key = `${s.app} · ${s.page_label}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(s);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sections = [...groups.entries()].map(([key, items]) => `
  <section>
    <h2>${esc(key)} <small>${items.length} shots</small></h2>
    <p class="src">${esc(items[0].url)}</p>
    <div class="grid">
      ${items.map((s) => `
        <figure>
          <a href="${esc(s.file)}" target="_blank"><img loading="lazy" src="${esc(s.file)}" alt="${esc(s.file)}"></a>
          <figcaption>${esc(s.file.split("/").pop())}<br><span>${esc(s.sha256.slice(0, 12))}</span></figcaption>
        </figure>`).join("")}
    </div>
  </section>`).join("");

const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>todo-app-REA — evidence gallery</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; font:14px/1.5 system-ui,sans-serif; background:#111; color:#eee; }
  header { padding:28px 24px; border-bottom:1px solid #333; }
  h1 { margin:0 0 6px; font-size:22px; }
  header p { margin:0; color:#999; }
  section { padding:22px 24px; border-bottom:1px solid #222; }
  h2 { font-size:15px; margin:0 0 2px; }
  h2 small { color:#888; font-weight:400; margin-left:8px; }
  .src { margin:0 0 14px; color:#777; font-size:12px; word-break:break-all; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
  figure { margin:0; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:8px; overflow:hidden; }
  img { display:block; width:100%; height:auto; background:#000; }
  figcaption { padding:8px 10px; font-size:11px; color:#bbb; }
  figcaption span { color:#666; font-family:ui-monospace,monospace; }
  a { color:inherit; }
</style></head>
<body>
<header>
  <h1>todo-app-REA — evidence gallery</h1>
  <p>${m.screenshots.length} screenshots · generated ${esc(m.generated_at)} · viewport ${m.viewport.width}×${m.viewport.height}</p>
</header>
${sections}
</body></html>`;
fs.writeFileSync("evidence/gallery.html", html);
console.log(JSON.stringify({ groups: groups.size, screenshots: m.screenshots.length }));
