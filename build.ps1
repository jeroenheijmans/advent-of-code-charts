Remove-Item build -Recurse -Force -Confirm:$false
mkdir build

Copy-Item icon*.png build/
Copy-Item node_modules/moment/min/moment.min.js build/
Copy-Item node_modules/chart.js/dist/Chart.min.js build/
Copy-Item src/js/app.js build/app.js
Copy-Item manifest.json build/manifest.json
Copy-Item src/img/Emoji*.svg build/

# Workaround for: https://stackoverflow.com/questions/51948350/
# See also: https://github.com/chartjs/Chart.js/issues/5901
Add-Content -Path build/moment.min.js -Value "`n`nwindow.moment = moment;"