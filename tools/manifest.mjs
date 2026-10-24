// Build evidence/manifest.json and evidence/MANIFEST.md from captured files + REA evidence.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve("evidence");
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

const pages = {
  asana: {
    home: { dir: "screenshots", exclude: ["login.png"], url: "https://asana.com/", label: "Marketing home" },
    login: { dir: "screenshots", include: ["login.png"], url: "https://app.asana.com/-/login", label: "App login" },
    product: { dir: "screenshots-product", url: "https://asana.com/product", label: "Product overview" },
  },
  toggl: {
    home: { dir: "screenshots", exclude: ["login.png"], url: "https://toggl.com/", label: "Marketing home" },
    login: { dir: "screenshots", include: ["login.png"], url: "https://accounts.toggl.com/track/login/", label: "Track login" },
  },
  habitica: {
    home: { dir: "screenshots", exclude: ["login.png"], url: "https://habitica.com/static/home", label: "Marketing home" },
    login: { dir: "screenshots", include: ["login.png"], url: "https://habitica.com/login", label: "Login" },
    features: { dir: "screenshots-features", url: "https://habitica.com/static/features", label: "Features" },
  },
  tiimo: {
    home: { dir: "screenshots", exclude: ["login.png"], url: "https://www.tiimoapp.com/", label: "Marketing home" },
    login: { dir: "screenshots", include: ["login.png"], url: "https://webapp.tiimoapp.com/sign-in", label: "Web app sign-in" },
    todolist: { dir: "screenshots-todo-list", url: "https://www.tiimoapp.com/product/to-do-list", label: "To-do list product page" },
  },
  structured: {
    home: { dir: "screenshots", exclude: ["login.png"], url: "https://structured.app/", label: "Marketing home" },
    login: { dir: "screenshots", include: ["login.png"], url: "https://web.structured.app/auth/login", label: "Structured Web login" },
  },
};

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null);
const rows = [];
const rea = [];

for (const [app, map] of Object.entries(pages)) {
  for (const [key, meta] of Object.entries(map)) {
    const inspectPath = path.join(root, app, `rea-inspect-${key}.json`);
    const ins = readJson(inspectPath);
    if (ins) {
      rea.push({
        app,
        page: key,
        operation: ins.operation,
        evidence_id: ins.evidence_id,
        target_url: ins.normalized_result?.target?.url ?? meta.url,
        captured_at: ins.normalized_result?.capture_window?.started_at ?? null,
        file: `evidence/${app}/rea-inspect-${key}.json`,
        sha256: sha(path.join(root, app, `rea-inspect-${key}.json`)),
      });
    }
    if (!meta.dir) continue;
    const dir = path.join(root, app, meta.dir);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)
      .filter((x) => x.endsWith(".png"))
      .filter((x) => !meta.exclude?.includes(x))
      .filter((x) => !meta.include || meta.include.includes(x))
      .sort()) {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      rows.push({
        app,
        page: key,
        page_label: meta.label,
        url: meta.url,
        file: `evidence/${app}/${meta.dir}/${f}`,
        bytes: stat.size,
        sha256: sha(p),
        captured_at: stat.mtime.toISOString(),
      });
    }
  }
}

for (const app of Object.keys(pages)) {
  const bp = path.join(root, app, "rea-bundle.json");
  const b = readJson(bp);
  if (b) {
    rea.push({
      app,
      page: "bundle",
      operation: b.operation,
      evidence_id: b.evidence_id,
      target_url: b.normalized_result?.capture?.target_url ?? null,
      captured_at: null,
      file: `evidence/${app}/rea-bundle.json`,
      sha256: sha(bp),
    });
  }
}

const manifest = {
  generated_at: new Date().toISOString(),
  viewport: { width: 1440, height: 960, effective_inner_width: 1424, effective_inner_height: 865 },
  capture_method: "Local headless Chrome 156 via CDP; section sweeps scroll in 850 px steps; full-page via Page.captureScreenshot captureBeyondViewport.",
  screenshots: rows,
  rea_evidence: rea,
};
fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2));

const md = [];
md.push("# Evidence manifest\n");
md.push(`Generated: ${manifest.generated_at}\n`);
md.push(`Screenshots: **${rows.length}** · REA records: **${rea.length}**\n`);
md.push("\n## Screenshots\n");
md.push("| App | Page | File | Size | SHA-256 (first 16) |\n|---|---|---|---|---|\n");
for (const r of rows) {
  const kb = Math.round(r.bytes / 1024);
  md.push(`| ${r.app} | ${r.page_label} | \`${r.file}\` | ${kb} KB | \`${r.sha256.slice(0, 16)}\` |\n`);
}
md.push("\n## REA evidence records\n");
md.push("| App | Page | Operation | Evidence ID | Target |\n|---|---|---|---|---|\n");
for (const r of rea) {
  md.push(`| ${r.app} | ${r.page} | ${r.operation} | \`${r.evidence_id}\` | ${r.target_url} |\n`);
}
md.push("\n## Method\n");
md.push("- Browser: local Google Chrome 156.0.8078.47, headless=new, 1440×960 window, 1× DPR, en-US.\n");
md.push("- Navigation and page-side interaction: Chrome DevTools Protocol (`tools/cdp.mjs`).\n");
md.push("- Passive inspection and static bundle analysis: REA 6.4.0 (`rea inspect-web-page`, `rea analyze-web-bundle`).\n");
md.push("- Computed-style audit: `tools/page-audit.js` (read-only `getComputedStyle`, no page mutation).\n");
md.push("- Public pages only; no account was created and no authenticated app screen was accessed.\n");
fs.writeFileSync(path.join(root, "MANIFEST.md"), md.join(""));
console.log(JSON.stringify({ screenshots: rows.length, rea: rea.length, manifest: "evidence/manifest.json" }));
