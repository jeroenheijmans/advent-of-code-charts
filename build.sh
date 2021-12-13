#!/usr/bin/env bash
rm -rf build
mkdir build

cp icon*.png build/
cp node_modules/moment/min/moment.min.js build/moment.min.js
cp node_modules/chart.js/dist/Chart.min.js build/Chart.min.js
cp src/js/app.js build/app.js
cp manifest.json build/manifest.json
cp src/img/Emoji*.svg build/

# Workaround for: https://stackoverflow.com/questions/51948350/
# See also: https://github.com/chartjs/Chart.js/issues/5901
echo "; window.moment = moment;" >> build/moment.min.js