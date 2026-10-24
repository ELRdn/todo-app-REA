// Print a compact digest of one page-audit JSON.
import fs from "node:fs";
const file = process.argv[2];
const a = JSON.parse(fs.readFileSync(file, "utf8"));
const pick = (list) => list.map((x) => `${x.value} ×${x.count}`).join(" | ");

console.log(`# ${a.title}\n${a.url}\nviewport ${a.viewport.w}×${a.viewport.h} doc ${a.viewport.docH}px, ${a.counts.elements} visible elements\n`);
console.log("FONTS       ", pick(a.palette.fontFamily));
console.log("SIZES       ", pick(a.palette.fontSize));
console.log("WEIGHTS     ", pick(a.palette.fontWeight));
console.log("LINE-HEIGHT ", pick(a.palette.lineHeight));
console.log("TRACKING    ", pick(a.palette.letterSpacing));
console.log("TEXT COLOR  ", pick(a.palette.text));
console.log("BACKGROUND  ", pick(a.palette.background));
console.log("BORDERS     ", pick(a.palette.border));
console.log("RADIUS      ", pick(a.palette.radius));
console.log("SHADOW      ", pick(a.palette.shadow));
console.log("GAP         ", pick(a.palette.gap));

const interesting = /(color|font|radius|space|spacing|shadow|surface|border|text|bg|brand|accent|primary|neutral|gray|grey|size|weight)/i;
const vars = Object.entries(a.cssVariables).filter(([k]) => interesting.test(k));
console.log(`\nCSS VARS (${vars.length}/${Object.keys(a.cssVariables).length} matching)\n` + vars.slice(0, 90).map(([k, v]) => `${k}: ${v}`).join("\n"));

console.log("\nHEADINGS");
for (const h of a.headings) console.log(`  ${h.tag} ${h.size}/${h.weight} lh:${h.lineHeight} ls:${h.letterSpacing} ${h.font} @y${h.top} :: ${h.text}`);

console.log("\nBUTTONS");
for (const b of a.buttons.slice(0, 24)) console.log(`  "${b.text}" ${b.w}×${b.h} r:${b.radius} bg:${b.bg} fg:${b.color} ${b.size}/${b.weight} pad:${b.padding} border:${b.border}`);

console.log("\nLANDMARKS");
for (const l of a.landmarks) console.log(`  ${l.tag}${l.role ? "[" + l.role + "]" : ""} y${l.top} ${l.w}×${l.h} ${l.position} bg:${l.bg} :: ${l.class}`);

console.log("\nFONTS LOADED", [...new Set(a.fontsLoaded.map((f) => `${f.family} ${f.weight}`))].join(" | "));
