// Usage: node scripts/codemods/spinner-sweep.mjs [--write] [srcDir]
import fs from "node:fs";
import path from "node:path";
const write = process.argv.includes("--write");
const root = process.argv.find((a, i) => i > 1 && !a.startsWith("--")) ?? "src";
const RE = /<RefreshCw\b([^>]*?)\s+className=\{([^"{}?]+?) \? "animate-spin" : ""\}\s*\/>/g;
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && !p.includes(path.join("admin","users"))) walk(p, out); }
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}
let changed = 0;
for (const f of walk(root)) {
  let s = fs.readFileSync(f, "utf8");
  let m, hit = false;
  RE.lastIndex = 0;
  const edits = [];
  while ((m = RE.exec(s))) edits.push({ i: m.index, len: m[0].length, attrs: m[1], cond: m[2].trim() });
  for (const e of edits.reverse()) {
    const b = s.lastIndexOf("<button", e.i);
    if (b < 0) continue;
    let tag = s.slice(b, e.i);
    const cm = /className="([^"]*)"/.exec(tag);
    let newTag;
    if (cm) newTag = tag.replace(cm[0], `className={\`${cm[1]} \${${e.cond} ? "is-busy" : ""}\`}`);
    else newTag = tag.replace("<button", `<button className={${e.cond} ? "is-busy" : undefined}`);
    newTag = newTag.replace(/disabled=\{/, (x) => x);
    s = s.slice(0, b) + newTag + `<RefreshCw${e.attrs} />` + s.slice(e.i + e.len);
    hit = true;
  }
  if (hit) { changed++; console.log((write ? "write " : "dry   ") + f); if (write) fs.writeFileSync(f, s); }
}
console.log(changed + " files");
