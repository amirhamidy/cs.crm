#!/usr/bin/env node
// Replaces category-A backdrop classNames with the shared .modal-backdrop.
// Usage: node scripts/codemods/backdrop.mjs [--write] [--root=.] [--report=.agent/audit/overlays.md]
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const write = args.includes("--write");
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split("=")[1];
const root = path.resolve(opt("root", "."));
const reportPath = path.resolve(root, opt("report", ".agent/audit/overlays.md"));
const LIMIT = 40;

const sections = {};
let cur = null;
for (const line of fs.readFileSync(reportPath, "utf8").split("\n")) {
    const h = line.match(/^## ([ABC])\)/);
    if (h) { cur = h[1]; sections[cur] = []; continue; }
    const r = line.match(/^\| `([^`:]+):(\d+)`/);
    if (r && cur) sections[cur].push(r[1]);
}
const uniq = (a) => [...new Set(a)];
const aFiles = uniq(sections.A || []).filter((f) => !f.startsWith("src/components/ui/") && fs.existsSync(path.join(root, f)));

// className="..." made only of: (absolute|fixed) inset-0 bg-black/NN [backdrop-blur-*]
const re = /className="([^"]*)"/g;
const changes = [];
const skipped = [];
for (const f of aFiles) {
    const src = fs.readFileSync(path.join(root, f), "utf8");
    let count = 0;
    const out = src.replace(re, (full, cls) => {
        const t = cls.split(/\s+/).filter(Boolean);
        const pos = t.find((x) => x === "absolute" || x === "fixed");
        const rest = t.filter((x) => x !== pos && x !== "inset-0");
        const ok = pos && t.includes("inset-0") && rest.length >= 1 &&
            rest.every((x) => /^bg-black\/\d+$/.test(x) || /^backdrop-blur(-\w+)?$/.test(x)) &&
            rest.some((x) => x.startsWith("bg-black/"));
        if (!ok) return full;
        count++;
        return `className="modal-backdrop ${pos} inset-0"`;
    });
    if (count) changes.push({ f, count, src, out });
    else skipped.push(f);
}

const batch = changes.slice(0, LIMIT);
const rest = changes.slice(LIMIT);
console.log(`mode: ${write ? "WRITE" : "dry-run"}`);
console.log(`A files in report: ${aFiles.length}; matched: ${changes.length}; no match: ${skipped.length}`);
for (const c of batch) {
    const a = c.src.split("\n"), b = c.out.split("\n");
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) console.log(`${c.f}:${i + 1}\n  - ${a[i].trim()}\n  + ${b[i].trim()}`);
    if (write) fs.writeFileSync(path.join(root, c.f), c.out);
}
if (rest.length) console.log(`NOT processed (limit ${LIMIT}):\n${rest.map((c) => c.f).join("\n")}`);
if (skipped.length) console.log(`A files without matching className:\n${skipped.join("\n")}`);
console.log(`files ${write ? "changed" : "to change"}: ${batch.length}`);
console.log(`B (list only): ${uniq(sections.B || []).length}\n${uniq(sections.B || []).join("\n")}`);
console.log(`C (list only): ${uniq(sections.C || []).length}\n${uniq(sections.C || []).join("\n")}`);
