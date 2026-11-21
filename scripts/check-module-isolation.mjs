
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/modules");

const walk = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? walk(path.join(d, e.name))
        : /\.tsx?$/.test(e.name)
        ? [path.join(d, e.name)]
        : [],
    );

let bad = 0;
for (const mod of fs
  .readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory())) {
  for (const f of walk(path.join(root, mod.name))) {
    const src = fs.readFileSync(f, "utf8");

    for (const m of src.matchAll(
      /from\s+["']@\/modules\/([^/"']+)\/([^"']+)["']/g,
    )) {
      if (m[1] !== mod.name) {
        bad++;
        console.error(
          `${path.relative(".", f)}: deep import into "${
            m[1]
          }" -> use "@/modules/${m[1]}"`,
        );
      }
    }

    for (const m of src.matchAll(/from\s+["'](\.\.\/)+([^"']+)["']/g)) {
      const resolved = path.resolve(
        path.dirname(f),
        m[0].match(/["'](.+)["']/)[1],
      );
      if (
        !resolved.startsWith(path.join(root, mod.name)) &&
        resolved.startsWith(root)
      ) {
        bad++;
        console.error(
          `${path.relative(".", f)}: relative import escapes module`,
        );
      }
    }
  }
}

if (bad) process.exit(1);
console.log("[isolation] ok");
