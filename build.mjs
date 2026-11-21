// Cross-platform build script. Usage: `npm run build` (or `node build.mjs`)
//
// Creates:
//   build/addon/                                     ready-to-go browser extension (load unpacked, or zip for the stores)
//   build/userscript/advent-of-code-charts.user.js   single-file userscript (Tampermonkey, Violentmonkey, ...)
//
// Safety: all paths are anchored to the location of this script, never to the
// current working directory, so it behaves the same wherever it is started from.
// The only recursive delete is guarded (see `assertSafeToDelete`).

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const at = (...segments) => join(root, ...segments);
const read = (...segments) => readFileSync(at(...segments), "utf8");

const buildDir = at("build");
const addonDir = at("build", "addon");
const userscriptDir = at("build", "userscript");

/** Refuse to delete anything but this repo's own `build` folder. */
function assertSafeToDelete(target) {
    const pkg = JSON.parse(read("package.json"));
    const problems = [];

    if (pkg.name !== "advent-of-code-charts") problems.push(`package.json name is "${pkg.name}"`);
    if (resolve(target) !== join(root, "build")) problems.push("target is not <root>/build");
    if (basename(target) !== "build") problems.push("target is not named 'build'");
    if (resolve(dirname(target)) !== resolve(root)) problems.push("target is not directly inside root");
    if (dirname(root) === root) problems.push("root is a filesystem root");

    if (problems.length > 0) {
        console.error(`Refusing to delete ${target}:\n- ${problems.join("\n- ")}`);
        process.exit(1);
    }
}

const manifest = JSON.parse(read("addon-assets", "manifest.json"));

const libs = [
    ["node_modules", "moment", "min", "moment.min.js"],
    ["node_modules", "chart.js", "dist", "chart.umd.js"],
    ["node_modules", "chartjs-adapter-moment", "dist", "chartjs-adapter-moment.min.js"],
];

// --- Browser extension ---------------------------------------------------

assertSafeToDelete(buildDir);
rmSync(buildDir, { recursive: true, force: true });
mkdirSync(addonDir, { recursive: true });
mkdirSync(userscriptDir, { recursive: true });

for (const icon of readdirSync(at("addon-assets")).filter((f) => /^icon.*\.png$/.test(f))) {
    cpSync(at("addon-assets", icon), join(addonDir, icon));
}
for (const lib of libs) {
    cpSync(at(...lib), join(addonDir, lib[lib.length - 1]));
}
cpSync(at("src", "js", "app.js"), join(addonDir, "app.js"));
cpSync(at("src", "css", "app.css"), join(addonDir, "app.css"));
cpSync(at("addon-assets", "manifest.json"), join(addonDir, "manifest.json"));

// --- Userscript ----------------------------------------------------------

const repo = "https://github.com/jeroenheijmans/advent-of-code-charts";
// Always serves the file attached to the newest GitHub Release; the filename must stay constant.
const userscriptReleaseUrl = `${repo}/releases/latest/download/advent-of-code-charts.user.js`;

const header = [
    "// ==UserScript==",
    `// @name         ${manifest.name}`,
    `// @namespace    ${repo}`,
    `// @version      ${manifest.version}`,
    `// @description  ${manifest.description}`,
    `// @author       ${manifest.author}`,
    `// @homepageURL  ${repo}`,
    `// @updateURL    ${userscriptReleaseUrl}`,
    `// @downloadURL  ${userscriptReleaseUrl}`,
    `// @match        https://adventofcode.com/*`,
    `// @run-at       document-end`,
    `// @grant        none`,
    "// ==/UserScript==",
].join("\n");

// The CSS goes through JSON.stringify so backticks, quotes etc. cannot break the script.
const injectCss = `(function () {
    const style = document.createElement("style");
    style.textContent = ${JSON.stringify(read("src", "css", "app.css"))};
    document.head.appendChild(style);
}());`;

// Some UMD bundles (notably moment.min.js) attach themselves to top-level `this`.
// In extension content scripts that is the window, but userscript managers wrap the
// script so `this` is something else, leaving e.g. `moment` undefined for the Chart.js
// date adapter (which then silently registers an empty adapter). Forcing `this` to
// `globalThis` for each library makes all of them agree on where globals live.
// The newline before the closing brace protects against trailing `//# sourceMappingURL` comments.
const wrapLib = (source) => `(function () {\n${source}\n}).call(globalThis);`;

const parts = [
    header,
    injectCss,
    ...libs.map((lib) => wrapLib(read(...lib))),
    read("src", "js", "app.js"),
];

const userscriptPath = join(userscriptDir, "advent-of-code-charts.user.js");
writeFileSync(userscriptPath, parts.join("\n\n") + "\n");

console.log(`Built v${manifest.version}: ${addonDir} (extension) and ${userscriptPath} (userscript)`);
