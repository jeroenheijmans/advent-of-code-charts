Remove-Item build -Recurse -Force -Confirm:$false
mkdir build

Copy-Item icon*.png build/
Copy-Item node_modules/moment/min/moment.min.js build/
Copy-Item node_modules/chart.js/dist/chart.umd.js build/
Copy-Item node_modules/chartjs-adapter-moment/dist/chartjs-adapter-moment.min.js build/
Copy-Item src/js/app.js build/app.js
Copy-Item src/css/app.css build/app.css
Copy-Item manifest.json build/manifest.json

# Workaround for: https://stackoverflow.com/questions/51948350/
# See also: https://github.com/chartjs/Chart.js/issues/5901
Add-Content -Path build/moment.min.js -Value "`n`nwindow.moment = moment;"