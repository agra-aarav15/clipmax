import { copyFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Next 16's static export writes a route's RSC payload at
 * `<route>/__next.<route>/__PAGE__.txt`, while the client prefetches
 * `<route>/__next.<route>.__PAGE__.txt`. On a plain static host the first path
 * looks like a directory, so every prefetch logs a 404. Copy the payload to the
 * dotted path as well; navigation already works, this just keeps the console
 * clean on GitHub Pages.
 */
const outDir = path.join(process.cwd(), "out");
let copied = 0;

for (const entry of await readdir(outDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const routeDir = path.join(outDir, entry.name);
  for (const child of await readdir(routeDir, { withFileTypes: true })) {
    if (!child.isDirectory() || !child.name.startsWith("__next.")) continue;

    const source = path.join(routeDir, child.name, "__PAGE__.txt");
    if (!existsSync(source)) continue;

    await copyFile(source, path.join(routeDir, `${child.name}.__PAGE__.txt`));
    copied += 1;
  }
}

console.log(`[pages] copied ${copied} RSC payload(s) to static-export paths`);
