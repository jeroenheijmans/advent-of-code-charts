#!/usr/bin/env bash
rm -rf build
mkdir build

cp icon*.png build/
cp node_modules/moment/min/moment.min.js build/
cp node_modules/chart.js/dist/Chart.min.js build/
cp src/js/app.js build/app.js
cp manifest.json build/manifest.json
