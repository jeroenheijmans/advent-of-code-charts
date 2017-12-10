Remove-Item build -Recurse -Force -Confirm:$false
mkdir build

Copy-Item icon*.png build/
Copy-Item node_modules/moment/min/moment.min.js build/
Copy-Item node_modules/chart.js/dist/Chart.min.js build/
Copy-Item src/js/app.js build/app.js
Copy-Item manifest.json build/manifest.json
