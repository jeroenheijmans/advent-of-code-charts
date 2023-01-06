(function (aoc) {

    // See https://stackoverflow.com/a/71395413/419956 by user @EJAntonPotot
    Chart.register({
        id: 'custom_canvas_background_color',
        beforeDraw: (chart, _args, _options) => {
            const {
              ctx,
              chartArea: { top, left, width, height },
            } = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(left, top, width, height);
            ctx.restore();
        },
    });

    const aocColors = {
        "main": "rgba(200, 200, 200, 0.9)",
        "secondary": "rgba(150, 150, 150, 0.9)",
        "tertiary": "rgba(100, 100, 100, 0.5)",
        "highlight": "rgba(119,119,165,.2)",
        "link": "#009900",
    };

    const graphColorStyles = [
        "Original (1)",
        "Rainbow Alphabetic (2)",
        "Rainbow Score (3)",
        "Fire Alphabetic (4)",
        "Fire Score (5)"
    ];

    const podiumLength = 3;

    const pointsOverTimeType = [
        "(◉ POINTS | ◎ percentages | ◎ percentages with potential)",
        "(◎ points | ◉ PERCENTAGES | ◎ percentages with potential)",
        "(◎ points | ◎ percentages | ◉ PERCENTAGES WITH POTENTIAL)",
    ];

    let presumedLoggedInUserName = null;
    try {
        presumedLoggedInUserName = document.querySelector(".user").childNodes[0].textContent.trim();
        if (!presumedLoggedInUserName) {
            presumedLoggedInUserName = document
                .querySelector(".user")
                .textContent
                .replace("(AoC++) ", "") // Individual sponsor marking
                .replace("(Sponsor) ", "") // Company sponsor marking
                .replace(/\d\d?\*/, "") // E.g. "1*" or "50*"
                .trim();
        }
    } catch (e) {
        console.info("Could not reliably determine logged in user from AoC website html. Something may have changed in the HTML structure, or perhaps there's an edge case we've missed. Either way, we'll ignore this error and carry on.");
    }

    function range(from, to) {
        return [...Array(to - from).keys()].map(k => k + from);
    }

    function colorWithOpacity(color, alpha) {
        if (color.includes("#")) {
            return Chart.helpers.color(color).alpha(alpha).rgbString();
        } else if (color.includes("hsl")) {
            return `${color.slice(0, -1)}, ${alpha})`;
        } else {
            return color;
        }
    }

    function starSorter(a, b) {
        return a.starIndex - b.starIndex;
    }

    function getPalette(n, rainbow, original) {
        if (original) {
            const basePalette = ["#781c81", "#6e1980", "#65187f", "#5e187e", "#58197e", "#531b7f", "#4f1d81", "#4c2182", "#492484", "#462987", "#442d8a", "#43328d", "#423791", "#413d94", "#404298", "#3f489c", "#3f4ea0", "#3f53a5", "#3f59a9", "#3f5fad", "#4064b1", "#4069b5", "#416fb8", "#4274bb", "#4379be", "#447dc0", "#4582c1", "#4686c2", "#488ac2", "#4a8ec1", "#4b92c0", "#4d95be", "#4f99bb", "#519cb8", "#549fb4", "#56a2b0", "#58a4ac", "#5ba7a7", "#5ea9a2", "#60ab9d", "#63ad98", "#66af93", "#69b18e", "#6cb289", "#70b484", "#73b580", "#77b67b", "#7ab877", "#7eb973", "#82ba6f", "#85ba6b", "#89bb68", "#8dbc65", "#91bd61", "#95bd5e", "#99bd5c", "#9dbe59", "#a1be56", "#a5be54", "#a9be52", "#adbe50", "#b1be4e", "#b5bd4c", "#b9bd4a", "#bcbc48", "#c0bb47", "#c3ba45", "#c7b944", "#cab843", "#cdb641", "#d0b540", "#d3b33f", "#d6b13e", "#d8ae3d", "#dbab3c", "#dda93b", "#dfa53a", "#e0a239", "#e29e38", "#e39a37", "#e49636", "#e59235", "#e68d34", "#e78833", "#e78332", "#e77d31", "#e77730", "#e7712f", "#e66b2d", "#e6642c", "#e55e2b", "#e4572a", "#e35029", "#e24928", "#e14226", "#df3b25", "#de3424", "#dc2e22", "#db2721", "#d92120"];
            let step = basePalette.length / n;
            return [...Array(n).keys()].map(i => basePalette[Math.floor(i * step, 0)]);
        }

        if (rainbow)
            // Dynamic rainbow palette using hsl()
            return [...Array(n).keys()].map(i => "hsl(" + i * 300 / n + ", 100%, 50%)");

        // Dynamic fire palette red->yellow->green using hsl()
        return [...Array(n).keys()].map(i => "hsl(" + i * 120 / n + ", 100%, 50%)")
    }

    function adjustPoinstFor(year, dayKey, starKey, basePoints) {
        // https://github.com/jeroenheijmans/advent-of-code-charts/issues/18
        if (year === 2018 && dayKey === "6") {
            return 0;
        }

        if (year === 2020 && dayKey === "1") {
            return 0;
        }

        return basePoints;
    }

    function transformRawAocJson(json) {
        let stars = [];
        let year = parseInt(json.event);

        let n_members = Object.keys(json.members).length;
        let members = Object.keys(json.members)
            .map(k => json.members[k])
            .map((m) => {
                let i = 0;
                m.isLoggedInUser = m.name === presumedLoggedInUserName;
                m.radius =  m.isLoggedInUser ? 5: 3;
                m.borderWidth = m.isLoggedInUser ? 4 : 1;
                m.pointStyle = m.isLoggedInUser ? "rectRot" : "circle"
                m.stars = [];
                m.name = m.name || `(anonymous user ${m.id})`;

                for (let dayKey of Object.keys(m.completion_day_level)) {
                    for (let starKey of Object.keys(m.completion_day_level[dayKey])) {
                        let starMoment = moment.unix(m.completion_day_level[dayKey][starKey].get_star_ts).utc();

                        let star = {
                            memberId: m.id,
                            dayNr: parseInt(dayKey, 10),
                            dayKey: dayKey,
                            starNr: parseInt(starKey, 10),
                            starKey: starKey,
                            getStarDay: parseInt(`${dayKey}.${starKey}`, 10),
                            getStarTimestamp: m.completion_day_level[dayKey][starKey].get_star_ts,
                            getStarMoment: starMoment,
                            starIndex: m.completion_day_level[dayKey][starKey].star_index,
                            timeTaken: null, // adding this later on, which is easier :D
                            timeTakenSeconds: null, // adding this later on as well
                        };

                        stars.push(star);
                        m.stars.push(star);
                    }
                }

                m.stars = m.stars.sort(starSorter);

                m.stars.forEach((s, idx) => {
                    s.nrOfStarsAfterThisOne = idx + 1;

                    let startOfDay = moment.utc([year, 11, s.dayNr, 5, 0, 0]); // AoC starts at 05:00 UTC
                    s.timeTaken = s.getStarMoment.diff(startOfDay, "minutes");
                    s.timeTakenSeconds = s.getStarMoment.diff(startOfDay, "seconds");
                });

                return m;
            })
            .filter(m => m.stars.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));

        let allMoments = stars.map(s => s.getStarMoment).concat([moment("" + year + "-12-25T00:00:00-0000")]);
        let maxMoment = moment.min([moment.max(allMoments), moment("" + year + "-12-31T00:00:00-0000")]);

        let availablePoints = {};

        for (let i = 1; i <= 25; i++) {
            availablePoints[i] = {};
            for (let j = 1; j <= 2; j++) {
                availablePoints[i][j] = n_members;
            }
        }

        let orderedStars = stars.sort(starSorter);

        for (let star of orderedStars) {
            const basePoints = availablePoints[star.dayKey][star.starKey]--;
            star.points = adjustPoinstFor(year, star.dayKey, star.starKey, basePoints);
            star.rank = n_members - basePoints + 1;
        }

        for (let m of members) {
            let accumulatedPoints = 0;
            for (let s of m.stars.sort(starSorter)) {
                accumulatedPoints += s.points;
                s.nrOfPointsAfterThisOne = accumulatedPoints;
                m.score = accumulatedPoints;
            }
        }

        let maxDay = Math.max.apply(Math, stars.filter(s => s.starNr === 2).map(s => s.dayNr))
        let days = {};

        for (let d = 1; d <= maxDay; d++) {
            days[d] = {
                dayNr: d,
                podium: stars.filter(s => s.dayNr === d && s.starNr === 2).sort(starSorter),
                podiumFirstPuzzle: stars.filter(s => s.dayNr === d && s.starNr === 1).sort(starSorter),
            };

            for (let i = 0; i < days[d].podium.length; i++) {
                days[d].podium[i].awardedPodiumPlace = i;
                days[d].podiumFirstPuzzle[i].awardedPodiumPlaceFirstPuzzle = i;
            }
        }

        for (let m of members) {
            m.podiumPlacesPerDay = getPodiumFor(m);
            m.podiumPlacesPerDayFirstPuzzle = getPodiumForFirstPuzzle(m);
        }

        let curGraphColorStyle = (getCurrentGraphColorStyle() || "").toLowerCase();
        let isOriginal = curGraphColorStyle.includes("original");
        let isRainbow = curGraphColorStyle.includes("rainbow");
        let orderByScore = curGraphColorStyle.includes("score");
        let colors = getPalette(members.length, isRainbow, isOriginal);

        if (orderByScore)
            members.sort((a, b) => b.score - a.score).forEach((m, idx) => m.color = colors[idx]);
        else
            members.forEach((m, idx) => m.color = colors[idx]);

        return {
            owner_id: json.owner_id,
            maxDay: maxDay,
            maxMoment: maxMoment,
            days: days,
            stars: stars,
            members: members,
            year: year,
            n_members: n_members,
        };
    }

    function getPodiumFor(member) {
        let medals = [];
        for (let p = 0; p < podiumLength; p++) {
            medals.push(member.stars.filter(s => s.awardedPodiumPlace === p).length);
        }
        return medals;
    }

    function getPodiumForFirstPuzzle(member) {
        let medals = [];
        for (let p = 0; p < podiumLength; p++) {
            medals.push(member.stars.filter(s => s.awardedPodiumPlaceFirstPuzzle === p).length);
        }
        return medals;
    }

    function memberByPodiumSorter(a, b) {
        let aMedals = getPodiumFor(a);
        let bMedals = getPodiumFor(b);

        for (let i = 0; i < aMedals.length; i++) {
            if (aMedals[i] !== bMedals[i]) {
                return bMedals[i] - aMedals[i];
            }
        }

        aMedals = getPodiumForFirstPuzzle(a);
        bMedals = getPodiumForFirstPuzzle(b);

        for (let i = 0; i < aMedals.length; i++) {
            if (aMedals[i] !== bMedals[i]) {
                return bMedals[i] - aMedals[i];
            }
        }

        return b.local_score - a.local_score;
    }

    function getCacheKey() {
        return `aoc-data-v1-${document.location.pathname}`;
    }

    function getCache() {
        console.info("Getting cache", getCacheKey());
        return JSON.parse(localStorage.getItem(getCacheKey()));
    }

    function updateCache(data) {
        console.log("Updating cache");
        localStorage.setItem(getCacheKey(), JSON.stringify({ data: data, timestamp: Date.now() }));
        return data;
    }

    function clearCache() {
        console.log("Clearing cache", getCacheKey());
        localStorage.setItem(getCacheKey(), null);
    }

    function toggleShowAll() {
        localStorage.setItem("aoc-flag-v1-show-all", !isShowAllToggled());
        location.reload();
    }

    function isShowAllToggled() {
        return !!JSON.parse(localStorage.getItem("aoc-flag-v1-show-all"));
    }

    function toggleResponsiveness() {
        localStorage.setItem("aoc-flag-v1-is-responsive", !isResponsivenessToggled());
        location.reload();
    }

    function isResponsivenessToggled() {
        return !!JSON.parse(localStorage.getItem("aoc-flag-v1-is-responsive"));
    }

    function getCurrentGraphColorStyle() {
        return localStorage.getItem("aoc-flag-v1-color-style");
    }

    function toggleCurrentGraphColorStyle() {
        let cur = graphColorStyles.indexOf(getCurrentGraphColorStyle());
        localStorage.setItem("aoc-flag-v1-color-style", graphColorStyles[(cur + 1) % graphColorStyles.length]);
        location.reload();
    }

    function setDisplayDay(dayNumber) {
        localStorage.setItem("aoc-flag-v1-display-day", dayNumber);
    }

    function getDisplayDay() {
        let value = localStorage.getItem("aoc-flag-v1-display-day");
        return value;
    }

    function setTimeTableSort(sort) {
        localStorage.setItem("aoc-flag-v1-delta-sort", sort);
        location.reload();
    }

    function getTimeTableSort() {
        let value = localStorage.getItem("aoc-flag-v1-delta-sort") || "delta";
        return value;
    }

    function togglePointsOverTimeType() {
        localStorage.setItem("aoc-flag-v1-points-over-time-type-index", (getPointsOverTimeType() + 1) % pointsOverTimeType.length);
        location.reload();
    }

    function getPointsOverTimeType() {
        return +localStorage.getItem("aoc-flag-v1-points-over-time-type-index") || 0;
    }

    const defaultLegendClickHandler = Chart.defaults.plugins.legend.onClick;
    let prevClick;
    function isDoubleClick() {
        let now = new Date();
        if (!prevClick) {
            prevClick = now;
            return false;
        }

        let diff = now - prevClick;
        prevClick = now;

        return diff < 300;
    }

    function formatTimeTaken(seconds) {
        if (seconds > 24 * 3600) {
            return ">24h"
        }
        return moment().startOf('day').seconds(seconds).format('HH:mm:ss')
    }

    function formatStarMomentForTitle(memberStar) {
        return memberStar.getStarMoment.local().format("HH:mm:ss YYYY-MM-DD") + " (local time)";
    }

    function getLeaderboardJson() {
        // 1. Check if dummy data was loaded...
        if (!!aoc.dummyData) {
            console.info("Loading dummyData");

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(transformRawAocJson(aoc.dummyData));
                });
            }, 100);
        }
        // 2. Apparently we can use real calls...
        else {
            let anchor = document.querySelector("#api_info a");
            if (!!anchor) {
                let url = anchor.href;

                const cache = getCache();

                console.info("Found cache", cache);

                if (cache) {
                    const ttl = new Date(cache.timestamp + (5 * 60 * 1000));
                    console.info("Found cached value valid until", ttl);

                    if (Date.now() < ttl) {
                        console.info("Cache was still valid!");

                        return Promise.resolve(cache.data)
                            .then(json => transformRawAocJson(json));
                    }
                }

                console.info(`Loading data from url ${url}`);

                return fetch(url, { credentials: "same-origin" })
                    .then(data => data.json())
                    .then(json => updateCache(json))
                    .then(json => transformRawAocJson(json));
            } else {
                console.info("Could not find anchor to JSON feed, assuming no charts can be plotted here.");
                return new Promise((resolve, reject) => { });
            }
        }
    }

    class ChartOptions {
        constructor(titleText) {
            this.responsive = true;
            this.plugins = {
                legend: {
                    position: "right",
                    title: {
                        display: true,
                        text: "Change selection: 🖱 (double) click",
                        color: aocColors["main"],
                        font: { weight: "bold", },
                    },
                    labels: {
                        color: aocColors["main"],
                        usePointStyle: true,
                    },
                    onClick: function (event, legendItem, legend) {
                        defaultLegendClickHandler(event, legendItem, legend);

                        if (isDoubleClick()) {
                            let chart = this.chart;

                            // always show doubleclicked item
                            chart.getDatasetMeta(legendItem.datasetIndex).hidden = null;

                            // count how many hidden datasets are there
                            let hiddenCount = chart.data.datasets
                                .map((_, dataSetIndex) => chart.getDatasetMeta(dataSetIndex))
                                .filter(meta => meta.hidden)
                                .length;

                            // deciding to invert items 'hidden' state depending
                            // if they are already mostly hidden
                            let hide = (hiddenCount >= (chart.data.datasets.length - 1) * 0.5) ? null : true;

                            chart.data.datasets.forEach((_, dataSetIndex) => {
                                if (dataSetIndex === legendItem.datasetIndex) {
                                    return;
                                }

                                let dsMeta = chart.getDatasetMeta(dataSetIndex);
                                dsMeta.hidden = hide;
                            });

                            chart.update();
                        }
                    },
                },
                title: {
                    display: true,
                    text: titleText,
                    color: aocColors["main"],
                    font: {
                        weight: "normal",
                        size: 24,
                    },
                },
            };
            this.scales = {
                x: {
                    title: {
                        display: true,
                        text: "Day of Advent",
                        color: aocColors["main"],
                    },
                    grid: {
                        color: aocColors["tertiary"],
                    },
                },
                y: { },
            };
        }

        withOnClick(onClick) {
            this.onClick = onClick;
            return this;
        }

        withTooltips(definition) {
            this.plugins = this.plugins || {};
            this.plugins.tooltip = definition;
            return this;
        }

        withXStackedScale() {
            let x = this.scales.x;
            x.stacked = true;
            x.ticks = {
                fontColor: aocColors["main"],
            };
            return this;
        }

        withXTickingScale() {
            let x = this.scales.x;
            x.min = 0;
            x.max = 25;
            x.ticks = {
                color: aocColors["main"],
                stepSize: 1,
            };
            return this;
        }

        withXTimeScale(data) {
            let x = this.scales.x;
            x.type = "time";
            x.time = {
                displayFormats: {
                    day: 'D',
                },
            };
            x.ticks = {
                color: aocColors["main"],
                stepSize: 1,
            };
            x.min = moment([data.year, 10, 30, 17, 0, 0]);
            x.max = moment([data.year, 11, 31, 4, 0, 0]);
            return this;
        }

        withYScale(definition) {
            this.scales.y = definition;
            this.scales.y.ticks = {
                color: aocColors["main"],
            };
            return this;
        }
    }

    class App {
        constructor() {
            console.info("Constructing App");

            this.wrapper = document.body.appendChild(document.createElement("div"));
            this.controls = this.wrapper.appendChild(document.createElement("div"));
            this.medals = this.wrapper.appendChild(document.createElement("div"));
            this.perDayLeaderBoard = this.wrapper.appendChild(document.createElement("div"));
            this.graphs = this.wrapper.appendChild(document.createElement("div"));
            this.graphs.style.display = "flex";
            this.graphs.style.flexWrap = "wrap";
            this.graphs.style.flexDirection = "row";

            if (!getCurrentGraphColorStyle())
                toggleCurrentGraphColorStyle();

            getLeaderboardJson()
                .then(data => this.loadCacheBustingButton(data))
                .then(data => this.loadMedalOverview(data))
                .then(data => this.loadPerDayLeaderBoard(data))
                .then(data => this.loadPointsOverTime(data))
                .then(data => this.loadStarsOverTime(data))
                .then(data => this.loadDayVsTime(data))
                .then(data => this.loadTimePerStar(data));
        }

        loadHr(data) {
            this.controls.appendChild(document.createElement("hr"));
            return data;
        }

        loadCacheBustingButton(data) {
            const cacheBustLink = this.controls.appendChild(document.createElement("a"));
            cacheBustLink.innerText = "🔄 Clear Charts Cache";
            cacheBustLink.style.cursor = "pointer";
            cacheBustLink.style.background = aocColors.tertiary;
            cacheBustLink.style.display = "inline-block";
            cacheBustLink.style.padding = "2px 8px";
            cacheBustLink.style.border = `1px solid ${aocColors.secondary}`;
            cacheBustLink.addEventListener("click", () => clearCache());

            const responsiveToggleLink = this.controls.appendChild(document.createElement("a"));
            responsiveToggleLink.innerText = (isResponsivenessToggled() ? "✅" : "❌") + " Responsive > 1800px";
            responsiveToggleLink.title = "Trigger side-by-side graphs if the viewport is wider than 1800px";
            responsiveToggleLink.style.cursor = "pointer";
            responsiveToggleLink.style.background = aocColors.tertiary;
            responsiveToggleLink.style.display = "inline-block";
            responsiveToggleLink.style.padding = "2px 8px";
            responsiveToggleLink.style.border = `1px solid ${aocColors.secondary}`;
            responsiveToggleLink.style.marginLeft = "8px";
            responsiveToggleLink.addEventListener("click", () => toggleResponsiveness());

            const colorToggleLink = this.controls.appendChild(document.createElement("a"));
            colorToggleLink.innerText = `🎨 Palette: ${getCurrentGraphColorStyle()}`;
            colorToggleLink.title = "Cycle through different graph color styles";
            colorToggleLink.style.cursor = "pointer";
            colorToggleLink.style.background = aocColors.tertiary;
            colorToggleLink.style.display = "inline-block";
            colorToggleLink.style.padding = "2px 8px";
            colorToggleLink.style.border = `1px solid ${aocColors.secondary}`;
            colorToggleLink.style.marginLeft = "8px";
            colorToggleLink.addEventListener("click", () => toggleCurrentGraphColorStyle());

            return data;
        }

        loadPerDayLeaderBoard(data) {
            this.perDayLeaderBoard.title = "Delta-focused overviews";
            let titleElement = this.perDayLeaderBoard.appendChild(document.createElement("h3"));
            titleElement.innerText = "Delta-focused stats: ";
            titleElement.style.fontFamily = "Source Code Pro, monospace";
            titleElement.style.fontWeight = "normal";
            titleElement.style.marginTop = "32px";
            titleElement.style.marginBottom = "8px";
            this.perDayLeaderBoard.style.marginBottom = "32px";

            let displayDay = getDisplayDay();
            
            if (displayDay !== "overview") {
                // taking the min to avoid going out of bounds for current year
                displayDay = displayDay ? Math.min(parseInt(displayDay), data.maxDay) : data.maxDay;
            }

            let tablePerDay = {}, anchorPerDay = {};

            for (let d = 1; d <= data.maxDay; ++d) {
                let a = titleElement.appendChild(document.createElement("a"));
                a.innerText = " " + d.toString();
                a.addEventListener("click", () => {
                    setDisplayDay(d);
                    setVisible(d);
                });
                a.style.cursor = "pointer";
                anchorPerDay[d] = a;
            }

            const divider = titleElement.appendChild(document.createElement("span"));
            divider.innerText = " | ";

            const overviewAnchor = titleElement.appendChild(document.createElement("a"));
            overviewAnchor.innerText = "Overview"
            overviewAnchor.addEventListener("click", () => {
                setDisplayDay("overview");
                setVisible("overview");
            });
            overviewAnchor.style.cursor = "pointer";
            anchorPerDay["overview"] = overviewAnchor;

            function generateOverviewTable() {
                const deltaLeaderBoard = document.createElement("table");
                tablePerDay[displayDay] = deltaLeaderBoard;

                deltaLeaderBoard.title = "Delta Leaderboard";
    
                let table = document.createElement("table");
                table.style.borderCollapse = "collapse";
                table.style.fontSize = "16px";
    
                function createHeaderCell(text, color = "inherit") {
                    const td = document.createElement("td");
                    td.innerText = text;
                    td.style.padding = "4px 8px";
                    td.style.color = color;
                    td.style.textAlign = "center";
                    td.style.cursor = "pointer";
                    return td;
                }
    
                {
                    // table header
                    let tr = table.appendChild(document.createElement("tr"));
                    let th = tr.appendChild(document.createElement("th"))
    
                    th = tr.appendChild(createHeaderCell("# Gold Stars"));
                    th = tr.appendChild(createHeaderCell("Median Delta Time", "#ffff66"));
                }
    
                function calculateDeltaTime(member) {
                    let starsByDay = {}
                    member.stars.forEach(star => {
                        if (starsByDay[star.dayNr] === undefined) {
                            starsByDay[star.dayNr] = []
                        }
                        starsByDay[star.dayNr][star.starNr - 1] = star.timeTakenSeconds;
                    });
    
                    let deltas = [];
                    for (const [key, value] of Object.entries(starsByDay)) {
                        if (value.length === 2) {
                            const delta = value[1] - value[0];
                            deltas.push(delta);
                        }
                    }
                    deltas = deltas.sort((a,b) => a-b);
    
                    let medianDelta = deltas.length > 0 ? deltas[Math.floor(deltas.length / 2)] : 0;
    
                    let goldStars = member.stars.filter(s => s.starNr === 2).length;
                    return {
                        name: member.name,
                        medianDelta: medianDelta,
                        goldStars: goldStars
                    }
                }
                let deltaData = data
                    .members
                    .map(x => JSON.parse(JSON.stringify(x)))
                    .map(member => calculateDeltaTime(member))
                    .sort((memberA, memberB) => memberA.medianDelta - memberB.medianDelta)
                    .sort((memberA, memberB) => memberB.goldStars - memberA.goldStars);
    
                let rank = 0;
                for (let member of deltaData) {
                    rank += 1;
                    let tr = table.appendChild(document.createElement("tr"));
                    let td = tr.appendChild(document.createElement("td"));
                    td.style.textAlign = "left";
                    td.innerText = rank + ". " + member.name;
                    td.style.border = "1px solid #333";
                    td.style.padding = "6px";
    
                    // Stars
                    td = tr.appendChild(document.createElement("td"));
                    td.innerText = member.goldStars;
                    td.style.textAlign = "center";
                    td.style.border = "1px solid #333";
                    td.style.padding = "6px";
    
                    // Median delta time
                    td = tr.appendChild(document.createElement("td"));
                    let median = formatTimeTaken(member.medianDelta);
                    td.innerText = median;
                    td.style.textAlign = "center";
                    td.style.border = "1px solid #333";
                    td.style.padding = "6px";
                }
    
                deltaLeaderBoard.appendChild(table);

                return deltaLeaderBoard;
            }

            function generateTable(displayDay) {
                let gridElement = document.createElement("table");
                tablePerDay[displayDay] = gridElement;
                gridElement.style.borderCollapse = "collapse";
                gridElement.style.fontSize = "16px";

                function sortByDeltaTime(a, b) {
                    let a1 = a.stars.find(s => s.dayNr === displayDay && s.starNr === 1);
                    let a2 = a.stars.find(s => s.dayNr === displayDay && s.starNr === 2);
                    let b1 = b.stars.find(s => s.dayNr === displayDay && s.starNr === 1);
                    let b2 = b.stars.find(s => s.dayNr === displayDay && s.starNr === 2);
                    if (!a2 && !b2) return 0;
                    if (!a2) return 1;
                    if (!b2) return -1;
                    const aTime = a2.timeTakenSeconds - a1.timeTakenSeconds;
                    const bTime = b2.timeTakenSeconds - b1.timeTakenSeconds;
                    if (aTime === bTime) return 0;
                    return aTime > bTime ? 1 : -1;
                }

                function sortByPart(starNr) {
                    return function sortByPart2Time(a, b) {
                        let aStar = a.stars.find(s => s.dayNr === displayDay && s.starNr === starNr);
                        let bStar = b.stars.find(s => s.dayNr === displayDay && s.starNr === starNr);
                        if (!aStar) return 1;
                        if (!bStar) return -1;
                        return aStar.timeTakenSeconds > bStar.timeTakenSeconds ? 1 : -1;
                    }
                }

                function sortByTotalPoints(a, b) {
                    let aPoints = a.stars.filter(s => s.dayNr == displayDay).reduce((acc, v) => acc + v.points, 0);
                    let bPoints = b.stars.filter(s => s.dayNr == displayDay).reduce((acc, v) => acc + v.points, 0);
                    return bPoints - aPoints;
                }

                let grid = data.members;
                let sortFns = {
                    "delta": sortByDeltaTime,
                    "completion": sortByTotalPoints,
                    "part1": sortByPart(1),
                    "part2": sortByPart(2),
                };
                grid.sort(sortFns[Object.keys(sortFns).find(k => k === getTimeTableSort()) || "delta"]);

                function createHeaderCell(sorting, text, color = "inherit") {
                    const td = document.createElement("td");
                    td.innerText = text;
                    td.style.padding = "4px 8px";
                    td.style.color = color;
                    td.style.textAlign = "center";
                    td.style.cursor = "pointer";
                    td.addEventListener("click", () => setTimeTableSort(sorting));
                    return td;
                }

                {
                    // first row header
                    let tr = gridElement.appendChild(document.createElement("tr"));
                    let th = tr.appendChild(document.createElement("th"))

                    th = tr.appendChild(createHeaderCell("part1", "----- Part 1 -----", "#9999cc"));
                    th.colSpan = 3;
                    th = tr.appendChild(createHeaderCell("delta", "----- Delta -----"));
                    th.title = "Everyone starting puzzles at different times? See who's the fastest to go from 1 to 2 stars on a day!";
                    th.colSpan = 1;
                    th = tr.appendChild(createHeaderCell("part2", "----- Part 2 -----", "#ffff66"));
                    th.colSpan = 3;
                    th = tr.appendChild(createHeaderCell("total", "----- Total -----"));
                    th.colSpan = 1;
                }
                {
                    // second row header
                    let tr = gridElement.appendChild(document.createElement("tr"));
                    let td = tr.appendChild(document.createElement("td"));

                    // Part 1
                    td = tr.appendChild(createHeaderCell("part1", "Time" + (getTimeTableSort() === "part1" ? " ⬇" : ""), "#9999cc"));
                    if (getTimeTableSort() === "part1") {
                        td.style.color = "#9999ee";
                        td.style.textShadow = "0 0 5px #9999cc";
                    }
                    td = tr.appendChild(createHeaderCell("part1", "Rank", "#9999cc"));
                    td = tr.appendChild(createHeaderCell("part1", "Points", "#9999cc"));

                    // Delta
                    td = tr.appendChild(createHeaderCell("delta", "Delta Time" + (getTimeTableSort() === "delta" ? " ⬇" : "")));
                    td.title = "Time difference between Part 2 and Part 1";
                    if (getTimeTableSort() === "delta") {
                        td.style.color = "#ffffff";
                        td.style.textShadow = "0 0 5px #ffffff";
                    }

                    // Part 2
                    td = tr.appendChild(createHeaderCell("part2", "Time" + (getTimeTableSort() === "part2" ? " ⬇" : ""), "#ffff66"));
                    if (getTimeTableSort() === "part2") {
                        td.style.color = "#ffff66";
                        td.style.textShadow = "0 0 5px #ffff66";
                    }
                    td = tr.appendChild(createHeaderCell("part2", "Rank", "#ffff66"));
                    td = tr.appendChild(createHeaderCell("part2", "Points", "#ffff66"));

                    // Total
                    td = tr.appendChild(createHeaderCell("completion", "Points" + (getTimeTableSort() === "completion" ? " ⬇" : "")));
                    if (getTimeTableSort() === "completion") {
                        td.style.color = "#ffffff";
                        td.style.textShadow = "0 0 5px #ffffff";
                    }
                }

                function createCell(text) {
                    const td = document.createElement("td");
                    td.innerText = text;
                    td.style.border = "1px solid #333";
                    td.style.padding = "6px";
                    td.style.textAlign = "center";
                    return td;
                }

                const maxSecondsForSparkline = 4 /* hours */ * 3600;
                let rank = 0;
                let maxDeltaTime = Math.max.apply(Math, grid
                    .map(m => {
                        let memberStar1 = m.stars.find(s => s.dayNr === displayDay && s.starNr === 1);
                        let memberStar2 = m.stars.find(s => s.dayNr === displayDay && s.starNr === 2);
                        const delta = memberStar2 ? memberStar2.timeTakenSeconds - memberStar1.timeTakenSeconds : null;
                        return delta > maxSecondsForSparkline ? null : delta;
                    }))
                ;

                for (let member of grid) {
                    let memberStar1 = member.stars.find(s => s.dayNr === displayDay && s.starNr === 1);
                    let memberStar2 = member.stars.find(s => s.dayNr === displayDay && s.starNr === 2);

                    // skip users that didn't solve any problem today
                    if (!memberStar1 && !memberStar2) {
                        continue;
                    }

                    rank += 1;

                    let tr = gridElement.appendChild(document.createElement("tr"));
                    if (member.isLoggedInUser) {
                        tr.style.backgroundColor = aocColors["highlight"];
                    }
                    let td = tr.appendChild(createCell(rank.toString() + ". " + member.name))
                    td.style.textAlign = "left";

                    td = tr.appendChild(createCell((memberStar1 ? formatTimeTaken(memberStar1.timeTakenSeconds) : "")))
                    td.title = memberStar1 ? formatStarMomentForTitle(memberStar1) : "Star 1 not done yet";
                    if (getTimeTableSort() === "part1") {
                        td.style.color = "#ffffff";
                        td.style.textShadow = "0 0 5px #ffffff";
                    }

                    td = tr.appendChild(createCell((memberStar1 ? memberStar1.rank : "")))
                    td = tr.appendChild(createCell((memberStar1 ? memberStar1.points : "")))

                    td = tr.appendChild(createCell(memberStar2 ? formatTimeTaken(memberStar2.timeTakenSeconds - memberStar1.timeTakenSeconds) : ""));
                    if (getTimeTableSort() === "delta") {
                        td.style.color = "#ffffff";
                        td.style.textShadow = "0 0 5px #ffffff";
                    }

                    if (memberStar2 && maxDeltaTime) {
                        const delta = memberStar2.timeTakenSeconds - memberStar1.timeTakenSeconds;
                        const fraction = Math.min(100, delta / maxDeltaTime * 100);
                        const sparkline = td.appendChild(document.createElement("div"));
                        sparkline.style.height = "2px";
                        sparkline.style.marginTop = "4px";
                        sparkline.style.marginBottom = "1px";
                        sparkline.style.width = `${fraction}%`;
                        sparkline.style.backgroundColor = "#ffffff";
                        if (getTimeTableSort() === "delta") {
                            sparkline.style.boxShadow = "1px 1px 5px rgba(255, 255, 255, 0.5), -1px -1px 5px rgba(255, 255, 255, 0.5)";
                        }
                        sparkline.style.opacity = delta > maxDeltaTime ? "0.15" : "0.75";
                        sparkline.title = "Spark line showing relative 'delta time' values (up to a maximum delta time)";
                    }

                    td = tr.appendChild(createCell((memberStar2 ? formatTimeTaken(memberStar2.timeTakenSeconds) : "")))
                    td.title = memberStar2 ? formatStarMomentForTitle(memberStar2) : "Star 2 not done yet";
                    if (getTimeTableSort() === "part2") {
                        td.style.color = "#ffffff";
                        td.style.textShadow = "0 0 5px #ffffff";
                    }

                    td = tr.appendChild(createCell((memberStar2 ? memberStar2.rank : "")))
                    td = tr.appendChild(createCell((memberStar2 ? memberStar2.points : "")))

                    let totalScore = 0;
                    if (memberStar1) {
                        totalScore += memberStar1.points;
                    }
                    if (memberStar2) {
                        totalScore += memberStar2.points;
                    }

                    td = tr.appendChild(createCell(totalScore ? totalScore : "0"))
                    if (getTimeTableSort() === "completion") {
                        td.style.color = "#ffffff";
                        td.style.textShadow = "0 0 5px #ffffff";
                    }
                }

                return gridElement;
            }

            function setVisible(day) {
                for (const t in tablePerDay) {
                    tablePerDay[t].style.display = "none";
                }
                tablePerDay[day].style.display = "table";
                
                for (const a in anchorPerDay) {
                    anchorPerDay[a].style.color = "";
                    anchorPerDay[a].style.textShadow = "";
                }
                anchorPerDay[day].style.color = "#ffffff";
                anchorPerDay[day].style.textShadow = "0 0 5px #ffffff";
            }

            for (let i=1; i <= data.maxDay; i++) {
                this.perDayLeaderBoard.appendChild(generateTable(i));
            }

            this.perDayLeaderBoard.appendChild(generateOverviewTable());

            setVisible(displayDay);

            return data;
        }

        loadMedalOverview(data) {
            const medalHtml = n => n === 0 ? "🥇" : n === 1 ? "🥈" : n === 2 ? "🥉" : `${n}`;
            const medalColor = n => n === 0 ? "gold" : n === 1 ? "silver" : n === 2 ? "#945210" : "rgba(15, 15, 35, 1.0)";

            // The default font stack of AoC is only the first two, so we add a few to the end here
            // to make sure that systems without the medals in the font will still see them if they
            // are present in the fallback fonts.
            // See also: https://github.com/jeroenheijmans/advent-of-code-charts/issues/56
            const medalFontFamily = '"Source Code Pro", monospace, serif, sans-serif, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
            
            this.medals.title =
              (isShowAllToggled()
                ? ''
                : 'For each day, the top 3 to get the second star are shown. ') +
              'Behind each medal you can get a glimpse of the podium for the *first* star.';
            let titleElement = this.medals.appendChild(document.createElement("h3"));
            titleElement.innerText = "Podium per day: ";
            titleElement.style.fontFamily = "Helvetica, Arial, sans-serif";
            titleElement.style.fontWeight = "normal";
            titleElement.style.marginBottom = "4px";
            
            const showAllToggleLink = titleElement.appendChild(document.createElement("a"));
            showAllToggleLink.innerText = isShowAllToggled() ? "🎄 Showing all participants" : "🥇 Showing only medalists";
            showAllToggleLink.title = "Toggle between showing only medalists or all participants";
            showAllToggleLink.style.cursor = "pointer";
            showAllToggleLink.addEventListener("click", () => toggleShowAll());

            let gridElement = document.createElement("table");
            gridElement.style.borderCollapse = "collapse";
            gridElement.style.fontSize = "16px";

            let grid = data.members;

            let tr = gridElement.appendChild(document.createElement("tr"));
            for (let d = 0; d <= 25; d++) {
                let td = tr.appendChild(document.createElement("td"));
                td.innerText = d === 0 ? "" : d;
                td.align = "center";
            }
            tr.appendChild(document.createElement("td"));
            for (let n = 0; n < podiumLength; n++) {
                let td = tr.appendChild(document.createElement("td"));
                let span = td.appendChild(document.createElement("span"));
                span.innerText = medalHtml(n);
                span.style.backgroundColor = medalColor(n);
                span.style.padding = "1px";
                span.style.fontFamily = medalFontFamily;
                td.style.padding = "4px";
                td.align = "center";
            }

            for (let member of grid.sort(memberByPodiumSorter)) {
                const cellColor = member.isLoggedInUser ? aocColors["highlight"] : "transparent";
                let tr = document.createElement("tr");
                let medalCount = 0;

                let td = tr.appendChild(document.createElement("td"));
                td.innerText = member.name;
                td.style.backgroundColor = cellColor;
                td.style.border = "1px solid #333";
                td.style.padding = "2px 8px";

                for (let d = 1; d <= 25; d++) {
                    let td = tr.appendChild(document.createElement("td"));
                    td.style.backgroundColor = cellColor;
                    td.style.border = "1px solid #333";
                    td.style.padding = "3px 4px";
                    td.style.textAlign = "center";

                    let div = td.appendChild(document.createElement("div"));
                    div.style.padding = "2px";
                    div.style.minWidth = "24px";
                    div.style.minHeight = "24px";

                    if (d <= data.maxDay) {
                        let secondPuzzlePodiumPlace = data.days[d].podium.findIndex(n => n.memberId === member.id);
                        let firstPuzzlePodiumPlace = data.days[d].podiumFirstPuzzle.findIndex(n => n.memberId === member.id);

                        if (firstPuzzlePodiumPlace >= 0 && firstPuzzlePodiumPlace < podiumLength) {
                            div.style.boxShadow = `inset 2px 2px 0 0 ${medalColor(firstPuzzlePodiumPlace)}, inset -2px -2px 0 0 ${medalColor(firstPuzzlePodiumPlace)}`;

                            medalCount++;
                        }

                        let span = div.appendChild(document.createElement("span"));
                        span.innerText = medalHtml(secondPuzzlePodiumPlace);
                        span.style.display = "block";
                        span.style.padding = "1px";
                        span.style.borderRadius = "2px";
                        span.style.border = "1px solid #333";
                        span.style.backgroundColor = medalColor(secondPuzzlePodiumPlace);
                        span.style.fontFamily = medalFontFamily;

                        let memberStar1 = member.stars.find(s => s.dayNr === d && s.starNr === 1);
                        let memberStar2 = member.stars.find(s => s.dayNr === d && s.starNr === 2);

                        td.title = (memberStar1 ? formatStarMomentForTitle(memberStar1) : "Star 1 not done yet")
                            + "\n"
                            + (memberStar2 ? formatStarMomentForTitle(memberStar2) : "Star 2 not done yet");

                        if (secondPuzzlePodiumPlace >= 0 && secondPuzzlePodiumPlace < podiumLength) {
                            medalCount++;
                            div.style.opacity = 0.5 + (0.5 * ((podiumLength - secondPuzzlePodiumPlace) / podiumLength));
                        } else {
                            span.innerText = secondPuzzlePodiumPlace >= 0 ? (secondPuzzlePodiumPlace + 1) : '\u2003';
                            span.style.opacity = 0.25;
                        }
                    }
                }

                let separator = tr.appendChild(document.createElement("td"));
                separator.innerText = "\u00A0";

                for (let n = 0; n < podiumLength; n++) {
                    let td = tr.appendChild(document.createElement("td"));
                    td.innerText = member.podiumPlacesPerDay[n];
                    td.style.backgroundColor = cellColor;
                    td.style.border = "1px solid #333";
                    td.style.padding = "2px 8px";
                    td.align = "center";
                }

                if (isShowAllToggled() || medalCount > 0) {
                    gridElement.appendChild(tr);
                }
            }

            this.medals.appendChild(gridElement);

            return data;
        }

        createGraphCanvas(data, title = "") {
            var element = document.createElement("canvas");
            if (isResponsivenessToggled()) {
                element.style.maxWidth = window.matchMedia("(min-width: 1800px)").matches ? "50%" : "100%";
            }
            element.title = title;
            return element;
        }

        loadDayVsTime(data) {
            let datasets = data.members.map(m => {
                return {
                    label: m.name,
                    backgroundColor: m.color,
                    borderWidth: 1,
                    borderColor: "#000",
                    pointRadius: m.radius * 2,
                    pointStyle: m.pointStyle,
                    data: m.stars.map(s => {
                        return {
                            x: s.dayNr + s.starNr / 2 - 1,
                            y: s.timeTaken
                        };
                    })
                };
            });

            let element = this.createGraphCanvas(data, "Log10 function of the time taken for each user to get the stars");
            this.graphs.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "scatter",
                data: {
                    datasets: datasets,
                },
                options: new ChartOptions("Stars vs Log10(minutes taken per star)")
                    .withTooltips({
                        callbacks: {
                            label: (item) => {
                                const day = Math.floor(Number(item.label) + 0.5);
                                const star = Number(item.label) < day ? 1 : 2;
                                const mins = item.value;
                                return `Day ${day} star ${star} took ${mins} minutes to complete`;
                            },
                        },
                    })
                    .withXTickingScale()
                    .withYScale({
                        type: "logarithmic",
                        ticks: {
                            fontColor: aocColors["main"],
                        },
                        title: {
                            display: true,
                            text: "minutes taken per star (log scale)",
                            color: aocColors["main"],
                        },
                        grid: {
                            color: aocColors["tertiary"],
                        },
                    })
            });

            return data;
        }

        loadTimePerStar(data) {
            let datasets = [];
            let n = Math.min((isResponsivenessToggled() ? 8 : data.members.length), data.members.length);
            let relevantMembers = data.members.sort((a, b) => b.score - a.score).slice(0, n);

            relevantMembers.forEach( (member, idx) => {
                let star1DataSet = {
                    label: `${member.name} (★)`,
                    stack: `Stack ${member.name}`,
                    backgroundColor: member.color,
                    data: [],
                    hidden: idx >= 3
                };

                let star2DataSet = {
                    label: `${member.name} (★★)`,
                    stack: `Stack ${member.name}`,
                    backgroundColor: colorWithOpacity(member.color, 0.5),
                    data: [],
                    hidden: idx >= 3
                };

                for (let i = 1; i <= 25; i++) {
                    let star1 = data.stars.find(s => s.memberId === member.id && s.dayNr === i && s.starKey === "1");
                    let star2 = data.stars.find(s => s.memberId === member.id && s.dayNr === i && s.starKey === "2");

                    star1DataSet.data.push(!!star1 ? star1.timeTaken : 0);
                    star2DataSet.data.push(!!star2 ? star2.timeTaken - star1.timeTaken : 0);
                }

                datasets.push(star1DataSet);
                datasets.push(star2DataSet);
            });

            let element = this.createGraphCanvas(data, "From the top players, show the number of minutes taken each day. (Exclude results over 4 hours.) (Toggle Responsive for all users)");
            this.graphs.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "bar",
                data: {
                    labels: range(1, 26),
                    datasets: datasets,
                },
                options: new ChartOptions(`Minutes taken per star`)
                    .withXStackedScale()
                    .withYScale({
                        stacked: true,
                        max: 240,
                        ticks: {
                            fontColor: aocColors["main"],
                        },
                        scaleLabel: {
                            display: true,
                            labelString: "minutes taken per star",
                            fontColor: aocColors["main"],
                        },
                        grid: {
                            color: aocColors["tertiary"],
                            zeroLineColor: aocColors["secondary"],
                        },
                    })
            });

            return data;
        }

        loadPointsOverTime(data) {
            const graphType = getPointsOverTimeType();
            const maxDayNr = Math.max(...data.stars.map(s => s.dayNr));
            const maxPointsPerDay = Array.from({ length: maxDayNr }, () => data.n_members * 2);

            // TODO: Perhaps do this while parsing so other graphs may use it?
            data.stars.forEach(s => maxPointsPerDay[s.dayNr-1] = s.points > 0 ? data.n_members * 2 : 0);
            const availablePoints = [maxPointsPerDay.map(p => p/2), maxPointsPerDay.map(p => p/2)];
            data.stars.forEach(s => availablePoints[s.starNr-1][s.dayNr-1] = Math.min(availablePoints[s.starNr-1][s.dayNr-1], Math.max(s.points-1, 0)));

            let datasets = data.members.sort((a, b) => a.name.localeCompare(b.name)).reduce((p, m) => {
                const days = m.stars.reduce(
                    (map, s) => {
                        const current = map.get(s.dayNr) ?? { stars: [], points:0 };
                        return map.set(s.dayNr, {
                            stars: [...current.stars, s],
                            points: current.points + s.points
                        });
                    },
                    new Map()
                );

                if (graphType === 2 && m.stars.length < maxPointsPerDay.length * 2) {
                    p.push({
                        label: m.name + ' (potential)',
                        lineTension: 0.1,
                        fill: false,
                        borderWidth: m.borderWidth,
                        borderColor: m.color,
                        borderDash: [1, 4],
                        backgroundColor: m.color,
                        pointStyle: m.pointStyle,
                        pointBorderWidth: 0.5,
                        pointBackgroundColor: "transparent",
                        data: maxPointsPerDay
                            .map((max, i) => ({
                                dayNr: i + 1,
                                ...(days.get(i + 1) ?? { stars: [], points: 0 })
                            }))
                            .map((day,i) => ({
                                ...day,
                                points: day.stars.length === 2 
                                    ? day.points
                                    : day.stars.length === 1
                                        ? (day.points + availablePoints[1][i])
                                        : (availablePoints[0][i] + availablePoints[1][i])
                            }))
                            .map((day, i, days) => ({
                                ...day,
                                pointsToDay: days.filter(d => d.dayNr <= day.dayNr).map(d => d.points).reduce((a,b) => a+b),
                                maxPointsToDay: maxPointsPerDay.slice(0, day.dayNr).reduce((p,max) => p+(max ?? 0), 0)
                            }))
                            .filter((day, i, days) => !days.filter(d => d.dayNr <= day.dayNr + 1).every(d => d.stars.length === 2))
                            .map((day) => ({
                                x: moment([data.year, 10, 30, 0, 0, 0]).add(day.dayNr, "d"),
                                y: day.pointsToDay / day.maxPointsToDay * 100,
                                day
                            })),
                    });
                }

                p.push({
                    label: m.name,
                    lineTension: 0.1,
                    fill: false,
                    borderWidth: m.borderWidth,
                    borderColor: m.color,
                    radius: m.radius,
                    pointStyle: m.pointStyle,
                    backgroundColor: m.color,
                    data: graphType !== 0 
                    ? maxPointsPerDay
                        .map((max, i) => ({ 
                            dayNr: i+1, 
                            ...(days.get(i+1) ?? { stars: [], points:0 })
                        }))
                        .map((day, i, days) => ({
                            ...day,
                            pointsToDay: days.filter(d => d.dayNr <= day.dayNr).map(d => d.points).reduce((a,b) => a+b),
                            maxPointsToDay: maxPointsPerDay.slice(0, day.dayNr).reduce((p,max) => p+(max ?? 0), 0)
                        }))
                        .map((day) => ({
                                x: moment([data.year, 10, 30, 0, 0, 0]).add(day.dayNr, "d"),
                                y: day.pointsToDay / day.maxPointsToDay * 100,
                                day
                            }))
                    : m.stars.filter(s => s.starNr === 2).map(s => {
                        return {
                            x: s.getStarMoment,
                            y: s.nrOfPointsAfterThisOne,
                            star: s
                        }
                    })
                });
                return p;
            }, []);

            const element = this.createGraphCanvas(data, "Points over time per member.");
            this.graphs.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "line",
                data: {
                    datasets: datasets,
                },
                plugins: [{
                    // See https://stackoverflow.com/a/75034834/419956 by user @LeeLenalee
                    afterEvent: (chart, evt) => {
                        const { event: { type, x, y, } } = evt;
                        if (type !== 'click') return;
                        const { titleBlock: { top, right, bottom, left, } } = chart;
                        if (left <= x && x <= right && bottom >= y && y >= top) {
                            togglePointsOverTimeType()
                        }
                    }
                }],
                options: new ChartOptions(`Points per Day - 🖱️ ${pointsOverTimeType[graphType]}`)
                    .withTooltips({
                        callbacks: {
                            afterLabel: (item) => {
                                if (graphType !== 0) {
                                    const day = item.dataset.data[item.dataIndex].day;
                                    return `(day ${day.dayNr}. Total: ${day.pointsToDay} of ${day.maxPointsToDay} points. Today: ${day.points} points, ranked ${day.stars.map(s => `${s.rank}.`).join(' and ') || '-'})`;
                                }
                                const star = item.dataset.data[item.dataIndex].star;
                                return `(completed day ${star.dayNr} star ${star.starNr})`;
                            },
                        },
                    })
                    .withXTimeScale(data)
                    .withYScale({
                        ticks: {
                            min: 0,
                            fontColor: aocColors["main"],
                        },
                        scaleLabel: {
                            display: true,
                            labelString: "cumulative points",
                            fontColor: aocColors["main"],
                        },
                        grid: {
                            color: aocColors["tertiary"],
                            zeroLineColor: aocColors["secondary"],
                        },
                    })
            });

            return data;
        }

        loadStarsOverTime(data) {
            let datasets = data.members.map(m => {
                return {
                    label: m.name,
                    lineTension: 0.2,
                    fill: false,
                    borderWidth: m.borderWidth,
                    borderColor: m.color,
                    radius: m.radius,
                    pointStyle: m.pointStyle,
                    backgroundColor: m.color,
                    data: m.stars.filter(s => s.starNr === 2).map(s => {
                        return {
                            x: s.getStarMoment,
                            y: s.nrOfStarsAfterThisOne,
                            star: s
                        };
                    }),
                }
            });

            let element = this.createGraphCanvas(data, "Number of stars over time per member.");
            this.graphs.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "line",
                data: {
                    datasets: datasets,
                },
                options: new ChartOptions("Leaderboard (stars)")
                    .withTooltips({
                        callbacks: {
                            afterLabel: (item) => {
                                const star = item.dataset.data[item.dataIndex].star;
                                return `(day ${star.dayNr} star ${star.starNr})`;
                            },
                        },
                    })
                    .withXTimeScale(data)
                    .withYScale({
                        ticks: {
                            stepSize: 1,
                            min: 0,
                            fontColor: aocColors["main"],
                        },
                        scaleLabel: {
                            display: true,
                            labelString: "nr of stars",
                            fontColor: aocColors["main"],
                        },
                        grid: {
                            color: aocColors["tertiary"],
                            zeroLineColor: aocColors["secondary"],
                        },
                    })
            });

            return data;
        }
    }

    aoc["App"] = App;

    function loadAdditions() {
        console.info("Going to construct App");
        new aoc.App();
    }

    if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") {
        console.info(`Loading via readyState = ${document.readyState}`);
        loadAdditions();
    } else {
        console.info(`Loading via DOMContentLoaded because readyState = ${document.readyState}`);
        document.addEventListener("DOMContentLoaded", () => loadAdditions());
    }

}(window.aoc = window.aoc || {}));
