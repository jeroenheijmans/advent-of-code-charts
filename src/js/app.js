(function (aoc) {
    // Based on https://stackoverflow.com/a/38493678/419956 by @user6586783
    Chart.pluginService.register({
        beforeDraw: function (chart, easing) {
            if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
                var ctx = chart.chart.ctx;
                var chartArea = chart.chartArea;
                ctx.save();
                ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
                ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
                ctx.restore();
            }
        }
    });

    const aocColors = {
        "main": "rgba(200, 200, 200, 0.9)",
        "secondary": "rgba(150, 150, 150, 0.9)",
        "tertiary": "rgba(100, 100, 100, 0.5)",
    };

    const graphColorStyles = [
        "Original (1)",
        "Rainbow Alphabetic (2)",
        "Rainbow Score (3)",
        "Fire Alphabetic (4)",
        "Fire Score (5)"
    ];

    const podiumLength = 3;

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
        return a.getStarMoment.utc().diff(b.getStarMoment.utc());
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

    /**
     * @typedef {{
     *   last_star_ts: string | number;
     *   global_score: number;
     *   completion_day_level: Record<string, Record<string, { get_star_ts: string; }>>;
     *   local_score: number;
     *   name: string | null;
     *   stars: number;
     *   id: string;
     * }} IMemberJson
     * 
     * @typedef {{
     *   event: string, 
     *   owner_id: string, 
     *   members: Record<string, IMemberJson>
     * }} IJson
     * 
     * @typedef {{
     *   memberId: string;
     *   dayNr: number;
     *   dayKey: string;
     *   starNr: number;
     *   starKey: string;
     *   getStarDay: number;
     *   getStarTimestamp: string;
     *   getStarMoment: moment.Moment;
     *   timeTaken: number;
     *   timeTakenSeconds: number;
     *   nrOfStarsAfterThisOne: number;
     *   points: number;
     *   rank: number;
     *   nrOfPointsAfterThisOne: number;
     *   awardedPodiumPlace: number;
     *   awardedPodiumPlaceFirstPuzzle: number;
     * }} IStar
     * 
     * @typedef {Omit<IMemberJson, "stars"> & {
     *   stars: IStar[];
     *   score: number;
     *   podiumPlacesPerDay: number[];
     *   podiumPlacesPerDayFirstPuzzle: number[];
     *   color: string;
     * }} IMember
     * 
     * @typedef {ReturnType<transformRawAocJson>} IData;
     */
    
    /**
    @param {IJson} json
    */
    function transformRawAocJson(json) {
        /** @type {IStar[]} */
        let stars = [];
        let year = parseInt(json.event);

        let n_members = Object.keys(json.members).length;
        let members = Object.keys(json.members)
            .map(k => json.members[k])
            .map((/** @type {IMember} */ m) => {
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

        /** @type {number} */
        let maxDay = Math.max.apply(Math, stars.filter(s => s.starNr === 2).map(s => s.dayNr))
        /** @type {Record<number, {
         *   dayNr: number;
         *   podium: IStar[];
         *   podiumFirstPuzzle: IStar[];
         * }>} */
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

    function legendOnClick(e, li) {
        // always do default click behavior
        Chart.defaults.global.legend.onClick.apply(this, [e, li]);

        if (isDoubleClick()) {
            let chart = this.chart;

            // always show doubleclicked item
            chart.getDatasetMeta(li.datasetIndex).hidden = null;

            // count how many hidden datasets are there
            let hiddenCount = chart.data.datasets
                .map((_, dataSetIndex) => chart.getDatasetMeta(dataSetIndex))
                .filter(meta => meta.hidden)
                .length;

            // deciding to invert items 'hidden' state depending
            // if they are already mostly hidden
            let hide = (hiddenCount >= (chart.data.datasets.length - 1) * 0.5) ? null : true;

            chart.data.datasets.forEach((_, dataSetIndex) => {
                if (dataSetIndex === li.datasetIndex) {
                    return;
                }

                let dsMeta = chart.getDatasetMeta(dataSetIndex);
                dsMeta.hidden = hide;
            });

            chart.update();
        }
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
            this.perDayLeaderBoard.title = "Per Day LeaderBoard";
            let titleElement = this.perDayLeaderBoard.appendChild(document.createElement("h3"));
            titleElement.innerText = "Stats Per Day: ";
            titleElement.style.fontFamily = "Source Code Pro, monospace";
            titleElement.style.fontWeight = "normal";
            titleElement.style.marginTop = "32px";
            titleElement.style.marginBottom = "8px";
            this.perDayLeaderBoard.style.marginBottom = "32px";

            let displayDay = getDisplayDay();
            // taking the min to avoid going out of bounds for current year
            displayDay = displayDay ? Math.min(parseInt(displayDay), data.maxDay) : data.maxDay;

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

            setVisible(displayDay);

            return data;
        }

        loadMedalOverview(data) {
            const medalHtml = n => n === 0 ? "🥇" : n === 1 ? "🥈" : n === 2 ? "🥉" : `${n}`;
            const medalColor = n => n === 0 ? "gold" : n === 1 ? "silver" : n === 2 ? "#945210" : "rgba(15, 15, 35, 1.0)";

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
                td.style.padding = "4px";
                td.align = "center";
            }

            for (let member of grid.sort(memberByPodiumSorter)) {
                let tr = document.createElement("tr");
                let medalCount = 0;

                let td = tr.appendChild(document.createElement("td"));
                td.innerText = member.name;
                td.style.border = "1px solid #333";
                td.style.padding = "2px 8px";

                for (let d = 1; d <= 25; d++) {
                    let td = tr.appendChild(document.createElement("td"));
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
                    pointRadius: 6,
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
                options: {
                    responsive: true,
                    tooltips: {
                        callbacks: {
                            label: (item, _) => {
                                const day = Math.floor(Number(item.label) + 0.5);
                                const star = Number(item.label) < day ? 1 : 2;
                                const mins = item.value;
                                return `Day ${day} star ${star} took ${mins} minutes to complete`;
                            },
                        },
                    },
                    chartArea: { backgroundColor: "rgba(0, 0, 0, 0.25)" },
                    legend: {
                        position: "right",
                        labels: {
                            fontColor: aocColors["main"],
                        },
                        onClick: legendOnClick
                    },
                    title: {
                        display: true,
                        text: "Stars vs Log10(minutes taken per star)",
                        fontSize: 24,
                        fontStyle: "normal",
                        fontColor: aocColors["main"],
                        lineHeight: 2.0,
                    },
                    scales: {
                        xAxes: [{
                            ticks: {
                                min: 0,
                                max: 25,
                                stepSize: 1,
                                fontColor: aocColors["main"],
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Day of Advent",
                                fontColor: aocColors["main"],
                            },
                            gridLines: {
                                color: aocColors["tertiary"],
                                zeroLineColor: aocColors["secondary"],
                            },
                        }],
                        yAxes: [{
                            type: "logarithmic",
                            ticks: {
                                fontColor: aocColors["main"],
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "minutes taken per star (log scale)",
                                fontColor: aocColors["main"],
                            },
                            gridLines: {
                                color: aocColors["tertiary"],
                                zeroLineColor: aocColors["secondary"],
                            },
                        }]
                    }
                }
            });

            return data;
        }

        loadTimePerStar(data) {
            let datasets = [];
            let n = Math.min(3, data.members.length);
            let relevantMembers = data.members.sort((a, b) => b.score - a.score).slice(0, n);

            for (let member of relevantMembers) {
                let star1DataSet = {
                    label: `${member.name} (★)`,
                    stack: `Stack ${member.name}`,
                    backgroundColor: member.color,
                    data: [],
                };

                let star2DataSet = {
                    label: `${member.name} (★★)`,
                    stack: `Stack ${member.name}`,
                    backgroundColor: colorWithOpacity(member.color, 0.5),
                    data: [],
                };

                for (let i = 1; i <= 25; i++) {
                    let star1 = data.stars.find(s => s.memberId === member.id && s.dayNr === i && s.starKey === "1");
                    let star2 = data.stars.find(s => s.memberId === member.id && s.dayNr === i && s.starKey === "2");

                    star1DataSet.data.push(!!star1 ? star1.timeTaken : 0);
                    star2DataSet.data.push(!!star2 ? star2.timeTaken - star1.timeTaken : 0);
                }

                // Over 240 minutes? Then just nullify the data, we assume folks didn't try.
                for (var i = 0; i < star1DataSet.data.length; i++) {
                    if (star1DataSet.data[i] + star2DataSet.data[i] > 240) {
                        if (star1DataSet.data[i] > 240) {
                            star1DataSet.data[i] = null;
                        }
                        star2DataSet.data[i] = null;
                    }
                }

                datasets.push(star1DataSet);
                datasets.push(star2DataSet);
            }

            let element = this.createGraphCanvas(data, "From the top players, show the number of minutes taken each day. (Exclude results over 4 hours.)");
            this.graphs.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "bar",
                data: {
                    labels: range(1, 26),
                    datasets: datasets,
                },
                options: {
                    responsive: true,

                    chartArea: { backgroundColor: "rgba(0, 0, 0, 0.25)" },
                    legend: {
                        position: "right",
                        labels: {
                            fontColor: aocColors["main"],
                        },
                        onClick: legendOnClick
                    },
                    title: {
                        display: true,
                        text: `Minutes taken per star - top ${n} players`,
                        fontSize: 24,
                        fontStyle: "normal",
                        fontColor: aocColors["main"],
                        lineHeight: 2.0,
                    },
                    scales: {
                        xAxes: [{
                            stacked: true,
                            ticks: {
                                fontColor: aocColors["main"],
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Day of Advent",
                                fontColor: aocColors["main"],
                            },
                            gridLines: {
                                color: aocColors["tertiary"],
                                zeroLineColor: aocColors["secondary"],
                            },
                        }],
                        yAxes: [{
                            stacked: true,
                            ticks: {
                                fontColor: aocColors["main"],
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "minutes taken per star",
                                fontColor: aocColors["main"],
                            },
                            gridLines: {
                                color: aocColors["tertiary"],
                                zeroLineColor: aocColors["secondary"],
                            },
                        }],
                    }
                }
            });

            return data;
        }

        /**
        * @param {IData} data
        */
        loadPointsOverTime(data) {
            let usePercentage = true;
            let maxPointsPerDay = data.n_members * 2;
            let datasets = data.members.sort((a, b) => a.name.localeCompare(b.name)).map(m => {
                return {
                    label: m.name,
                    lineTension: 0.2,
                    fill: false,
                    borderWidth: 1.5,
                    borderColor: m.color,
                    backgroundColor: m.color,
                    data: usePercentage 
                    ? Array.from(m.stars.reduce(
                            (/** @type {Map<number, IStar[]>} */ map, s) => map.set(s.dayNr, [...(map.get(s.dayNr) ?? []), s]),
                            new Map()
                        ).entries())
                        .sort((a,b) => a[0] - b[0])
                        .map(([key, stars]) => ({
                            dayNr: key, 
                            stars, 
                            points: stars.map(s => s.points).reduce((a,b) => a+b)
                        }))
                        .map((day, i, days) => ({
                                x: moment([data.year, 10, 30, 0, 0, 0]).add(day.dayNr, "d"),
                                // y: day.points / (maxPointsPerDay) * 100,
                                y: days.slice(0, i+1).map(d => d.points).reduce((a,b) => a+b) / (day.dayNr * maxPointsPerDay) * 100,
                                day
                            }))
                    : m.stars.map(s => {
                        return {
                            x: s.getStarMoment,
                            y: s.nrOfPointsAfterThisOne,
                            star: s
                        }
                    })
                };
            });
            let element = this.createGraphCanvas(data, "Points over time per member.");
            this.graphs.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "line",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    tooltips: {
                        callbacks: {
                            afterLabel: (item, data) => {
                                if (usePercentage) {
                                    const day = data.datasets[item.datasetIndex].data[item.index].day;
                                    return `(day ${day.dayNr}, ${day.points} points, ranked ${day.stars.map(s => `${s.rank}.`).join(' and ')})`;
                                }
                                const star = data.datasets[item.datasetIndex].data[item.index].star;
                                return `(completed day ${star.dayNr} star ${star.starNr})`;
                            },
                        },
                    },
                    chartArea: { backgroundColor: "rgba(0, 0, 0, 0.25)" },
                    legend: {
                        position: "right",
                        labels: {
                            fontColor: aocColors["main"],
                        },
                        onClick: legendOnClick
                    },
                    title: {
                        display: true,
                        text: "Leaderboard (points)",
                        fontSize: 24,
                        fontStyle: "normal",
                        fontColor: aocColors["main"],
                        lineHeight: 2.0,
                    },
                    scales: {
                        xAxes: [{
                            type: "time",
                            time: {
                                unit: "day",
                                stepSize: 1,
                                displayFormats: { day: "D" },
                            },
                            ticks: {
                                min: moment([data.year, 10, 30, 5, 0, 0]),
                                max: data.maxMoment,
                                fontColor: aocColors["main"],
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Day of Advent",
                                fontColor: aocColors["main"],
                            },
                            gridLines: {
                                color: aocColors["tertiary"],
                                zeroLineColor: aocColors["secondary"],
                            },
                        }],
                        yAxes: [{
                            ticks: {
                                min: 0,
                                fontColor: aocColors["main"],
                            },
                            scaleLabel: {
                                display: true,
                                labelString: usePercentage ? "percent" : "cumulative points",
                                fontColor: aocColors["main"],
                            },
                            gridLines: {
                                color: aocColors["tertiary"],
                                zeroLineColor: aocColors["secondary"],
                            },
                        }],
                    }
                }
            });

            return data;
        }

        loadStarsOverTime(data) {
            let datasets = data.members.map(m => {
                return {
                    label: m.name,
                    lineTension: 0.2,
                    fill: false,
                    borderWidth: 1.5,
                    borderColor: m.color,
                    backgroundColor: m.color,
                    data: m.stars.map(s => {
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
                options: {
                    responsive: true,
                    tooltips: {
                        callbacks: {
                            afterLabel: (item, data) => {
                                const star = data.datasets[item.datasetIndex].data[item.index].star;
                                return `(day ${star.dayNr} star ${star.starNr})`;
                            },
                        },
                    },
                    chartArea: { backgroundColor: "rgba(0, 0, 0, 0.25)" },
                    legend: {
                        position: "right",
                        labels: {
                            fontColor: aocColors["main"],
                        },
                        onClick: legendOnClick
                    },
                    title: {
                        display: true,
                        text: "Leaderboard (stars)",
                        fontSize: 24,
                        fontStyle: "normal",
                        fontColor: aocColors["main"],
                        lineHeight: 2.0,
                    },
                    scales: {
                        xAxes: [{
                            type: "time",
                            time: {
                                unit: "day",
                                stepSize: 1,
                                displayFormats: { day: "D" },
                            },
                            ticks: {
                                min: moment([data.year, 10, 30, 5, 0, 0]),
                                max: data.maxMoment,
                                fontColor: aocColors["main"],
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "Day of Advent",
                                fontColor: aocColors["main"],
                            },
                            gridLines: {
                                color: aocColors["tertiary"],
                                zeroLineColor: aocColors["secondary"],
                            },
                        }],
                        yAxes: [{
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
                            gridLines: {
                                color: aocColors["tertiary"],
                                zeroLineColor: aocColors["secondary"],
                            },
                        }],
                    }
                }
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
