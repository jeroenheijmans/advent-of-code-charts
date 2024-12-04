#!/usr/bin/env bash

OUT="build/aocc.user.js"

rm -rf build
mkdir build
touch $OUT

echo '// ==UserScript==' >> "$OUT"
echo '// @name        Advent of Code Charts' >> "$OUT"
echo '// @namespace   https://github.com/Bogdanp/awesome-advent-of-code' >> "$OUT"
echo '// @match       https://adventofcode.com/*/leaderboard/private/view/*' >> "$OUT"
echo '// @homepageURL https://github.com/Bogdanp/awesome-advent-of-code' >> "$OUT"
echo '// @run-at      document-end' >> "$OUT"
echo '// ==/UserScript==' >> "$OUT"
echo '' >> "$OUT"

cat node_modules/moment/min/moment.min.js >> "$OUT"
echo '' >> "$OUT"
cat node_modules/chart.js/dist/chart.umd.js >> "$OUT"
cat node_modules/chartjs-adapter-moment/dist/chartjs-adapter-moment.min.js >> "$OUT"
cat src/js/app.js >> "$OUT"

echo 'const style = document.createElement("style");' >> "$OUT"
echo 'style.textContent = `' >> "$OUT"
cat src/css/app.css >> "$OUT"
echo '`;' >> "$OUT"
echo 'document.head.appendChild(style);' >> "$OUT"
