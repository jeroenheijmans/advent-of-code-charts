Remove-Item build -Recurse -Force -Confirm:$false
mkdir build

Copy-Item addon-assets/icon*.png build/
Copy-Item node_modules/moment/min/moment.min.js build/
Copy-Item node_modules/chart.js/dist/chart.umd.js build/
Copy-Item node_modules/chartjs-adapter-moment/dist/chartjs-adapter-moment.min.js build/
Copy-Item src/js/app.js build/app.js
Copy-Item src/css/app.css build/app.css
Copy-Item addon-assets/manifest.json build/manifest.json
