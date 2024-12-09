// @ts-check

/**
 * @typedef moment
 * @property {import('moment')} moment
 */

(function (/** @type {any} */ aoc) {
    // Unsure how to add JSDoc types so for now like this.
    // See also: https://stackoverflow.com/q/77466760/419956
    const Chart = /** @type {any} */ (window["Chart"]);

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
    const largeLeaderboardCutOff = Math.trunc((window.innerWidth < 1600 ? 25 : 40) / (isResponsivenessToggled() ? 2 : 1));

    const pointsOverTimeType = [
        "(◉ POINTS | ◎ percentage | ◎ with potential)",
        "(◎ points | ◉ PERCENTAGE | ◎ with potential)",
        "(◎ points | ◎ percentage | ◉ WITH POTENTIAL)",
    ];

    let presumedLoggedInUserName = null;
    try {
        presumedLoggedInUserName = document.querySelector(".user")?.childNodes[0].textContent?.trim();
        if (!presumedLoggedInUserName) {
            presumedLoggedInUserName = document
                .querySelector(".user")
                ?.textContent
                ?.replace("(AoC++) ", "") // Individual sponsor marking
                .replace("(Sponsor) ", "") // Company sponsor marking
                .replace(/\d\d?\*/, "") // E.g. "1*" or "50*"
                .trim();
        }
    } catch (e) {
        console.info("Could not reliably determine logged in user from AoC website html. Something may have changed in the HTML structure, or perhaps there's an edge case we've missed. Either way, we'll ignore this error and carry on.");
    }

    /**
     * Create array of numbers in a range
     * @param {number} from - Starting number (inclusive)
     * @param {number} to - End of range (exclusive)
     * @returns {number[]}
     */
    function range(from, to) {
        return [...Array(to - from).keys()].map(k => k + from);
    }

    /**
     * Compare two star objects based on the index (first or second star)
     * @param {{starIndex: number}} a Some star to compare
     * @param {{starIndex: number}} b Some star to compare
     * @returns {number}
     */
    function starSorter(a, b) {
        return a.starIndex - b.starIndex;
    }

    /**
     * Compare two entries by deltaPointsTotal
     * @param {{deltaPointsTotal: number}} a Some day to compare
     * @param {{deltaPointsTotal: number}}  b  Some day to compare
     * @returns {number}
     */
    function deltaPointsTotalSorter(a, b) {
        return a.deltaPointsTotal - b.deltaPointsTotal;
    }

    /**
     * Get an array of color strings for a fixed number of entries
     * @param {number} n Number of distinct colors needed
     * @param {boolean} rainbow Whether to create a rainbow pattern
     * @param {boolean} original Whether to use the original color pattern
     * @returns {string[]}
     */
    function getPalette(n, rainbow, original) {
        if (original) {
            const basePalette = ["rgba(120, 28, 129, 1.0)", "rgba(110, 25, 128, 1.0)", "rgba(101, 24, 127, 1.0)", "rgba(94, 24, 126, 1.0)", "rgba(88, 25, 126, 1.0)", "rgba(83, 27, 127, 1.0)", "rgba(79, 29, 129, 1.0)", "rgba(76, 33, 130, 1.0)", "rgba(73, 36, 132, 1.0)", "rgba(70, 41, 135, 1.0)", "rgba(68, 45, 138, 1.0)", "rgba(67, 50, 141, 1.0)", "rgba(66, 55, 145, 1.0)", "rgba(65, 61, 148, 1.0)", "rgba(64, 66, 152, 1.0)", "rgba(63, 72, 156, 1.0)", "rgba(63, 78, 160, 1.0)", "rgba(63, 83, 165, 1.0)", "rgba(63, 89, 169, 1.0)", "rgba(63, 95, 173, 1.0)", "rgba(64, 100, 177, 1.0)", "rgba(64, 105, 181, 1.0)", "rgba(65, 111, 184, 1.0)", "rgba(66, 116, 187, 1.0)", "rgba(67, 121, 190, 1.0)", "rgba(68, 125, 192, 1.0)", "rgba(69, 130, 193, 1.0)", "rgba(70, 134, 194, 1.0)", "rgba(72, 138, 194, 1.0)", "rgba(74, 142, 193, 1.0)", "rgba(75, 146, 192, 1.0)", "rgba(77, 149, 190, 1.0)", "rgba(79, 153, 187, 1.0)", "rgba(81, 156, 184, 1.0)", "rgba(84, 159, 180, 1.0)", "rgba(86, 162, 176, 1.0)", "rgba(88, 164, 172, 1.0)", "rgba(91, 167, 167, 1.0)", "rgba(94, 169, 162, 1.0)", "rgba(96, 171, 157, 1.0)", "rgba(99, 173, 152, 1.0)", "rgba(102, 175, 147, 1.0)", "rgba(105, 177, 142, 1.0)", "rgba(108, 178, 137, 1.0)", "rgba(112, 180, 132, 1.0)", "rgba(115, 181, 128, 1.0)", "rgba(119, 182, 123, 1.0)", "rgba(122, 184, 119, 1.0)", "rgba(126, 185, 115, 1.0)", "rgba(130, 186, 111, 1.0)", "rgba(133, 186, 107, 1.0)", "rgba(137, 187, 104, 1.0)", "rgba(141, 188, 101, 1.0)", "rgba(145, 189, 97, 1.0)", "rgba(149, 189, 94, 1.0)", "rgba(153, 189, 92, 1.0)", "rgba(157, 190, 89, 1.0)", "rgba(161, 190, 86, 1.0)", "rgba(165, 190, 84, 1.0)", "rgba(169, 190, 82, 1.0)", "rgba(173, 190, 80, 1.0)", "rgba(177, 190, 78, 1.0)", "rgba(181, 189, 76, 1.0)", "rgba(185, 189, 74, 1.0)", "rgba(188, 188, 72, 1.0)", "rgba(192, 187, 71, 1.0)", "rgba(195, 186, 69, 1.0)", "rgba(199, 185, 68, 1.0)", "rgba(202, 184, 67, 1.0)", "rgba(205, 182, 65, 1.0)", "rgba(208, 181, 64, 1.0)", "rgba(211, 179, 63, 1.0)", "rgba(214, 177, 62, 1.0)", "rgba(216, 174, 61, 1.0)", "rgba(219, 171, 60, 1.0)", "rgba(221, 169, 59, 1.0)", "rgba(223, 165, 58, 1.0)", "rgba(224, 162, 57, 1.0)", "rgba(226, 158, 56, 1.0)", "rgba(227, 154, 55, 1.0)", "rgba(228, 150, 54, 1.0)", "rgba(229, 146, 53, 1.0)", "rgba(230, 141, 52, 1.0)", "rgba(231, 136, 51, 1.0)", "rgba(231, 131, 50, 1.0)", "rgba(231, 125, 49, 1.0)", "rgba(231, 119, 48, 1.0)", "rgba(231, 113, 47, 1.0)", "rgba(230, 107, 45, 1.0)", "rgba(230, 100, 44, 1.0)", "rgba(229, 94, 43, 1.0)", "rgba(228, 87, 42, 1.0)", "rgba(227, 80, 41, 1.0)", "rgba(226, 73, 40, 1.0)", "rgba(225, 66, 38, 1.0)", "rgba(223, 59, 37, 1.0)", "rgba(222, 52, 36, 1.0)", "rgba(220, 46, 34, 1.0)", "rgba(219, 39, 33, 1.0)", "rgba(217, 33, 32, 1.0)"];
            let step = basePalette.length / n;
            return [...Array(n).keys()].map(i => basePalette[Math.floor(i * step)]);
        }

        if (rainbow)
            // Dynamic rainbow palette using hsl()
            return [...Array(n).keys()].map(i => "hsla(" + i * 300 / n + ", 100%, 50%, 1.0)");

        // Dynamic fire palette red->yellow->green using hsl()
        return [...Array(n).keys()].map(i => "hsla(" + i * 120 / n + ", 100%, 50%, 1.0)")
    }

    /**
     * Take a color string that already has an "1.0" alpha component, and do a quick-and-dirty replace with a new alpha value
     * @param {string} color
     * @param {string|number} newAlpha
     * @returns {string}
     */
    function lowerAlpha(color, newAlpha) {
        // Look, this extensions is in "AoC-style", so we're allowed
        // some shortcuts that cannot be done in software that is meant
        // to earn big bugs or save lives or whatever. :-)
        return color.replace(", 1.0)", `, ${newAlpha})`)
    }

    /**
     * Adjust the points for a star of a given day (used to compensate for exceptions, e.g. a day that was worth 0 points)
     * @param {number} year
     * @param {string} dayKey
     * @param {string} _starKey
     * @param {number} basePoints
     * @returns {number}
     */
    function adjustPoinstFor(year, dayKey, _starKey, basePoints) {
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
     *   completion_day_level: Record<string, Record<string, { get_star_ts: number; star_index: number; }>>;
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
     *   starIndex: number;
     *   starNr: number;
     *   starKey: string;
     *   getStarDay: number;
     *   getStarTimestamp: number;
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
     *   isLoggedInUser: boolean;
     *   radius: number;
     *   borderWidth: number;
     *   pointStyle: string;
     *   stars: IStar[];
     *   deltas: IDelta[];
     *   deltaPointsTotal: number;
     *   deltaMeanSeconds: number;
     *   deltaMedianSeconds: number;
     *   rank: number;
     *   score: number;
     *   podiumPlacesPerDay: number[];
     *   podiumPlacesPerDayFirstPuzzle: number[];
     *   color: string;
     *   colorMuted: string;
     * }} IMember
     * 
     * @typedef {{
     *   dayNr: number;
     *   dayKey: string;
     *   deltaTimeTakenSeconds: number;
     *   member: IMember;
     *   points: number;
     * }} IDelta
     * 
     * @typedef {ReturnType<transformRawAocJson>} IData;
     * 
     * @typedef {{
     *   owner_id: string,
     *   maxDay: number,
     *   maxMoment: moment.Moment,
     *   days: IDaysMap,
     *   stars: IStar[],
     *   members: IMember[],
     *   year: number,
     *   n_members: number,
     *   maxDeltaPoints,
     *   loggedInUserIsPresumablyKnown,
     *   isLargeLeaderboard,
     *  }} IAppData
     * 
     * @typedef {Record<number, {
     *   dayNr: number;
     *   podium: IStar[];
     *   podiumFirstPuzzle: IStar[];
     * }>} IDaysMap
     */
    
    /**
     * @param {IJson} json
     * @returns {IAppData}
    */
    function transformRawAocJson(json) {
        let /** @type {IStar[]} */ stars = [];
        let /** @type {IDelta[]} */ deltas = [];
        let year = parseInt(json.event);
        let loggedInUserIsPresumablyKnown = false;
        
        let n_members = Object.keys(json.members).length;
        let isLargeLeaderboard = n_members > largeLeaderboardCutOff;

        let members = Object.keys(json.members)
            .map(k => json.members[k])
            .map(m => /** @type {IMember} */ (/** @type {unknown} */ (m)))
            .map((m) => {
                m.isLoggedInUser = m.name === presumedLoggedInUserName;
                loggedInUserIsPresumablyKnown = loggedInUserIsPresumablyKnown || m.isLoggedInUser;

                m.radius =  m.isLoggedInUser ? 4 : 3;
                m.borderWidth = m.isLoggedInUser ? 2.5 : 1;
                m.pointStyle = m.isLoggedInUser ? "rectRot" : "circle"
                m.stars = [];
                m.deltas = [];
                m.deltaPointsTotal = 0; // Calculated later
                m.deltaMeanSeconds = 0; // Calculated later
                m.deltaMedianSeconds = 0; // Calculated later
                m.name = m.name || `(anonymous user ${m.id})`;

                for (let dayKey of Object.keys(m.completion_day_level)) {
                    for (let starKey of Object.keys(m.completion_day_level[dayKey])) {
                        let starMoment = moment.unix(+m.completion_day_level[dayKey][starKey].get_star_ts).utc();

                        let /** @type {IStar} */ star = {
                            memberId: m.id,
                            dayNr: parseInt(dayKey, 10),
                            dayKey: dayKey,
                            starNr: parseInt(starKey, 10),
                            starKey: starKey,
                            getStarDay: parseInt(`${dayKey}.${starKey}`, 10),
                            getStarTimestamp: m.completion_day_level[dayKey][starKey].get_star_ts,
                            getStarMoment: starMoment,
                            starIndex: m.completion_day_level[dayKey][starKey].star_index,

                            // Setting defaults, calculating these properties later on in loops
                            timeTaken: 0,
                            timeTakenSeconds: 0,
                            nrOfStarsAfterThisOne: 0,
                            nrOfPointsAfterThisOne: 0,
                            points: 0,
                            rank: 0,
                            awardedPodiumPlace: -1,
                            awardedPodiumPlaceFirstPuzzle: -1,
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

                m.stars.filter(s => s.starNr === 2).forEach(star2 => {
                    const star1 = m.stars.find(s => s.dayNr === star2.dayNr && s.starNr === 1);
                    const deltaTimeTakenSeconds = star2.timeTakenSeconds - (star1?.timeTakenSeconds || 0);
                    const delta = { dayNr: star2.dayNr, dayKey: star2.dayKey, deltaTimeTakenSeconds, member: m, points: 0, };
                    deltas.push(delta);
                    m.deltas.push(delta);
                });

                const sortedDeltas = m.deltas
                    .slice()
                    .filter(d => d.deltaTimeTakenSeconds < 4 * 60 * 60) // Outliers distort images so we exclude them
                    .sort((a,b) => a.deltaTimeTakenSeconds - b.deltaTimeTakenSeconds);
                if (sortedDeltas.length > 0) {
                    m.deltaMedianSeconds = sortedDeltas[Math.trunc(sortedDeltas.length / 2)].deltaTimeTakenSeconds;
                    m.deltaMeanSeconds = sortedDeltas.map(x => x.deltaTimeTakenSeconds).reduce((a,b) => a+b) / sortedDeltas.length;
                }

                return m;
            })
            .filter(m => m.stars.length > 0)
            .sort((a, b) => a.name?.localeCompare(b?.name || "") || 0);

        let allMoments = stars.map(s => s.getStarMoment).concat([moment("" + year + "-12-25T00:00:00-0000")]);
        let maxMoment = moment.min([moment.max(allMoments), moment("" + year + "-12-31T00:00:00-0000")]);

        const maxDeltaPoints = members.filter(m => m.deltas.length > 0).length;
        for (let i = 1; i <= 25; i++) {
            let availableDeltaPoints = maxDeltaPoints;
            const sortedDeltas = deltas.filter(d => d.dayNr === i).sort((a,b) => a.deltaTimeTakenSeconds - b.deltaTimeTakenSeconds);
            for (let delta of sortedDeltas) {
                delta.points = availableDeltaPoints--;
                delta.member.deltaPointsTotal += delta.points;
            }
        }

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
        
        /** @type {IDaysMap} */
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
        let muteFactor = 0.25 + ((200 - n_members) / 200 * 0.5);

        members
            .slice()
            .sort((a, b) => b.score - a.score)
            .forEach((m, idx) => { m.rank = idx + 1; });

        if (orderByScore)
            members
                .sort((a, b) => b.score - a.score)
                .forEach((m, idx) => {
                    const color = colors[idx];
                    m.color = color;
                    m.colorMuted = lowerAlpha(colors[idx], muteFactor);
                    m.rank = idx + 1;
                });
        else
            members
                .forEach((m, idx) => {
                    const color = colors[idx];
                    m.color = color;
                    m.colorMuted = lowerAlpha(colors[idx], muteFactor);
                });

        return {
            owner_id: json.owner_id,
            maxDay: maxDay,
            maxMoment: maxMoment,
            days: days,
            stars: stars,
            members: members,
            year: year,
            n_members: n_members,
            maxDeltaPoints,
            loggedInUserIsPresumablyKnown,
            isLargeLeaderboard,
        };
    }

    function getPodiumFor(/** @type IMember */ member) {
        let medals = [];
        for (let p = 0; p < podiumLength; p++) {
            medals.push(member.stars.filter(s => s.awardedPodiumPlace === p).length);
        }
        return medals;
    }

    function getPodiumForFirstPuzzle(/** @type IMember */ member) {
        let medals = [];
        for (let p = 0; p < podiumLength; p++) {
            medals.push(member.stars.filter(s => s.awardedPodiumPlaceFirstPuzzle === p).length);
        }
        return medals;
    }

    function memberByPodiumSorter(/** @type IMember */ a, /** @type IMember */ b) {
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
        return JSON.parse(localStorage.getItem(getCacheKey()) || "null");
    }

    function updateCache(data) {
        console.log("Updating cache");
        localStorage.setItem(getCacheKey(), JSON.stringify({ data: data, timestamp: Date.now() }));
        return data;
    }

    function clearCache() {
        console.log("Clearing cache", getCacheKey());
        localStorage.setItem(getCacheKey(), "");
    }

    function toggleShowAll() {
        localStorage.setItem("aoc-flag-v1-show-all", !isShowAllToggled() + "");
        location.reload();
    }

    function isShowAllToggled() {
        return !!JSON.parse(localStorage.getItem("aoc-flag-v1-show-all") || "null");
    }

    function toggleResponsiveness() {
        localStorage.setItem("aoc-flag-v1-is-responsive", !isResponsivenessToggled() + "");
        location.reload();
    }

    function isResponsivenessToggled() {
        return !!JSON.parse(localStorage.getItem("aoc-flag-v1-is-responsive") || "null");
    }

    function getCurrentGraphColorStyle() {
        return localStorage.getItem("aoc-flag-v1-color-style") || "";
    }

    function toggleCurrentGraphColorStyle({ shouldReload = true } = {}) {
        let cur = graphColorStyles.indexOf(getCurrentGraphColorStyle());
        localStorage.setItem("aoc-flag-v1-color-style", graphColorStyles[(cur + 1) % graphColorStyles.length]);
        if (shouldReload) location.reload();
    }

    function setDisplayDay(/** @type string */ dayNumber) {
        localStorage.setItem("aoc-flag-v1-display-day", dayNumber);
    }

    function getDisplayDay() {
        return localStorage.getItem("aoc-flag-v1-display-day");
    }

    function setTimeTableSort(/** @type string */ sort) {
        localStorage.setItem("aoc-flag-v1-delta-sort", sort);
        location.reload();
    }

    function getTimeTableSort() {
        return localStorage.getItem("aoc-flag-v1-delta-sort") || "delta";
    }

    function togglePointsOverTimeType() {
        const value = (getPointsOverTimeType() + 1) % pointsOverTimeType.length;
        localStorage.setItem("aoc-flag-v1-points-over-time-type-index", value.toString());
        location.reload();
    }

    function getPointsOverTimeType() {
        return +(localStorage.getItem("aoc-flag-v1-points-over-time-type-index") || "0") || 0;
    }

    /** @typedef {"medals"|"perDayLeaderBoard"|"graphs"|null} IFullScreenSubject */
    function setFullScreenSubject(/** @type IFullScreenSubject */ subject) {
        localStorage.setItem("aoc-flag-v1-full-screen-subject", subject || "");

        if (subject === "graphs" && !isResponsivenessToggled()) {
            toggleResponsiveness();
        }
    }

    /** @returns {IFullScreenSubject} */
    function getFullScreenSubject() {
        return /** @type IFullScreenSubject */ (localStorage.getItem("aoc-flag-v1-full-screen-subject")) || null;
    }

    const defaultLegendClickHandler = Chart.defaults.plugins.legend.onClick;
    let prevClick;
    function isDoubleClick() {
        let now = new Date();
        if (!prevClick) {
            prevClick = now;
            return false;
        }

        let diff = now.getTime() - prevClick;
        prevClick = now;

        return diff < 300;
    }

    function formatTimeTaken(/** @type number */ seconds) {
        if (seconds > 24 * 3600) {
            return ">24h"
        }
        return moment().startOf('day').seconds(seconds).format('HH:mm:ss')
    }

    function formatStarMomentForTitle(/** @type IStar */ memberStar) {
        return memberStar.getStarMoment.local().format("HH:mm:ss YYYY-MM-DD") + " (local time)";
    }

    /** 
     * @returns {Promise<IAppData>}
     */
    function getLeaderboardJson() {
        // 1. Check if dummy data was loaded...
        if (!!aoc.dummyData) {
            console.info("Loading dummyData");

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(transformRawAocJson(aoc.dummyData));
                }, 10);
            });
        }
        // 2. Apparently we can use real calls...
        else {
            let anchor = /** @type {HTMLAnchorElement} */ (document.querySelector("#api_info a"));
            
            if (!!anchor) {
                let url = anchor.href;

                const cache = getCache();

                console.info("Found cache", cache);

                if (cache) {
                    const ttl = new Date(cache.timestamp + (5 * 60 * 1000));
                    console.info("Found cached value valid until", ttl);

                    if (Date.now() < ttl.getTime()) {
                        console.info("Cache was still valid!");

                        return Promise.resolve(cache.data)
                            .then(json => transformRawAocJson(json));
                    }
                }

                console.info(`Loading data from url ${url}`);

                return fetch(url, { credentials: "same-origin" })
                    .then(data => data.json())
                    .then(json => updateCache(json))
                    .then(() => getCache().data) // Workaround for FireFox error with "Xray Vision" / "XrayWrapper", see https://github.com/jeroenheijmans/advent-of-code-charts/issues/105 
                    .then(json => transformRawAocJson(json));
            } else {
                console.info("Could not find anchor to JSON feed, assuming no charts can be plotted here.");
                return new Promise((resolve, reject) => { });
            }
        }
    }

    class ChartOptions {
        constructor(data, /** @type string */ titleText) {
            this.responsive = true;
            this.aspectRation = 1;
            this.plugins = {
                legend: {
                    position: "right",
                    title: {
                        display: true,
                        // We compromise: for large leaderboards we really need to explain
                        // that only the top N are given a legend item. For smaller
                        // leaderboards (where all are shown) we make the click feature
                        // discoverable.
                        text: data.isLargeLeaderboard ? `Only Showing Top ${largeLeaderboardCutOff}` : "(🖱 click / 🖱🖱 click)",
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

            if (data.isLargeLeaderboard) {
                this.plugins.legend.labels.padding = 4;
                this.plugins.legend.labels.boxHeight = 6;
                this.plugins.legend.labels.boxWidth = 6;
            }
            this.plugins.legend.labels.filter = (legendItem, chartData) => {
                const dataset = chartData.datasets[legendItem.datasetIndex];
                return dataset.showInLegend;
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

        withXTimeScale(data, { xMax = 0, titleText = "Day of Advent" }) {
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
            x.max = moment([data.year, 11, xMax || 31, 4, 0, 0]);
            x.title.text = titleText;
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
            
            this.wrapper.id = "aoc-extension";
            this.medals.id = "aoc-extension-medals";
            this.perDayLeaderBoard.id = "aoc-extension-perDayLeaderBoard";
            this.graphs.id = "aoc-extension-graphs";

            if (isResponsivenessToggled()) {
                this.graphs.style.display = "grid";
            }

            this.graphs.style.gridTemplateColumns = "1fr 1fr";
            this.graphs.style.gap = "1rem";

            if (!getCurrentGraphColorStyle())
                toggleCurrentGraphColorStyle({shouldReload: false});

            getLeaderboardJson()
                .then(data => this.loadControlButtons(data))
                .then(data => this.loadMedalOverview(data))
                .then(data => this.loadPerDayLeaderBoard(data))
                .then(data => this.loadPointsOverTime(data))
                .then(data => this.loadStarsOverTime(data))
                .then(data => this.loadDayVsTime(data))
                .then(data => this.loadTimePerStar(data))
                .then(_data => this.setupFullScreenModes());
        }

        loadHr(data) {
            this.controls.appendChild(document.createElement("hr"));
            return data;
        }

        refreshFullScreenSetup() {
            const subject = getFullScreenSubject();
            switch (subject) {
                case "medals":
                case "perDayLeaderBoard":
                case "graphs":
                    document.body.classList.add('aoc-extension-with-full-screen-overlay');
                    this.medals.classList.toggle('aoc-extension-full-screen-subject', subject === "medals");
                    this.perDayLeaderBoard.classList.toggle('aoc-extension-full-screen-subject', subject === "perDayLeaderBoard");
                    this.graphs.classList.toggle('aoc-extension-full-screen-subject', subject === "graphs");
                    break;

                case null:
                default: 
                    document.body.classList.remove('aoc-extension-with-full-screen-overlay');
                    break;
            }
        }

        setupFullScreenModes(/** @type {IAppData} */ _data) {
            this.refreshFullScreenSetup();
            const exitFullScreenButton = document.createElement("div");
            exitFullScreenButton.className = "aoc-extension-full-screen-exit-button";
            exitFullScreenButton.innerText = "×";
            exitFullScreenButton.addEventListener("click", () => {
                setFullScreenSubject(null);
                this.refreshFullScreenSetup();
            });
            document.body.appendChild(exitFullScreenButton);

            document.documentElement.addEventListener("click", (event) => {
                if (event.target instanceof HTMLHtmlElement) {
                    setFullScreenSubject(null);
                    this.refreshFullScreenSetup();
                }
            });

            const fullScreenWarning = document.createElement("div");
            fullScreenWarning.style.display = "none";
            fullScreenWarning.classList.add("aoc-extension-full-screen-warning");
            fullScreenWarning.innerText = "Note: viewing full-screen leaderboard generated by browser extension. Exit with the button top-right.";
            document.body.appendChild(fullScreenWarning);
        }

        loadControlButtons(/** @type {IAppData} */ data) {
            const cacheBustLink = this.controls.appendChild(document.createElement("a"));
            cacheBustLink.innerText = "🔄 Clear Charts Cache";
            cacheBustLink.style.cursor = "pointer";
            cacheBustLink.style.background = aocColors.tertiary;
            cacheBustLink.style.display = "inline-block";
            cacheBustLink.style.padding = "2px 8px";
            cacheBustLink.style.border = `1px solid ${aocColors.secondary}`;
            cacheBustLink.addEventListener("click", () => clearCache());

            const responsiveToggleLink = this.controls.appendChild(document.createElement("a"));
            responsiveToggleLink.innerText = (isResponsivenessToggled() ? "✅" : "❌") + " Graphs in 2x2 grid";
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

            const fullScreenButtons = this.controls.appendChild(document.createElement("div"));
            fullScreenButtons.innerText = "| Go full screen with: ";
            fullScreenButtons.title = "Useful for example to show a permanent leaderboard in your office hallway on a monitor.";
            fullScreenButtons.className = "aoc-extension-full-screen-buttons";

            const medalsButton = document.createElement("a");
            medalsButton.innerText = "🥇";
            medalsButton.className = "aoc-extension-full-screen-button";
            medalsButton.addEventListener("click", () => { 
                setFullScreenSubject("medals");
                this.refreshFullScreenSetup();
            });
            fullScreenButtons.appendChild(medalsButton);
            const perDayLeaderBoardButton = document.createElement("a");
            perDayLeaderBoardButton.innerText = "📆";
            perDayLeaderBoardButton.className = "aoc-extension-full-screen-button";
            perDayLeaderBoardButton.addEventListener("click", () => { 
                setFullScreenSubject("perDayLeaderBoard");
                this.refreshFullScreenSetup();
            });
            fullScreenButtons.appendChild(perDayLeaderBoardButton);
            const graphsButton = document.createElement("a");
            graphsButton.innerText = "📈";
            graphsButton.className = "aoc-extension-full-screen-button";
            graphsButton.addEventListener("click", () => { 
                setFullScreenSubject("graphs");
                this.refreshFullScreenSetup();
            });
            fullScreenButtons.appendChild(graphsButton);

            return data;
        }

        loadPerDayLeaderBoard(/** @type {IAppData} */ data) {
            this.perDayLeaderBoard.title = "Delta-focused overviews";
            let titleElement = this.perDayLeaderBoard.appendChild(document.createElement("h3"));
            titleElement.innerText = "Delta-focused stats: ";
            titleElement.style.fontFamily = "Source Code Pro, monospace";
            titleElement.style.fontWeight = "normal";
            titleElement.style.marginTop = "32px";
            titleElement.style.marginBottom = "8px";
            this.perDayLeaderBoard.style.marginBottom = "32px";

            let /** @type {number|string|null} */ displayDay = getDisplayDay();

            if (data.maxDay <= 0) {
                let noDataText = this.perDayLeaderBoard.appendChild(document.createElement("p"));
                noDataText.innerText = "No data available yet.";
                noDataText.style.color = aocColors["secondary"];
                return data;
            }
            
            if (displayDay !== "overview") {
                // taking the min to avoid going out of bounds for current year
                displayDay = displayDay ? Math.min(parseInt(displayDay), data.maxDay) : data.maxDay;
            }

            let tablePerDay = {}, anchorPerDay = {};

            for (let d = 1; d <= data.maxDay; ++d) {
                let a = titleElement.appendChild(document.createElement("a"));
                a.dataset["key"] = d.toString();
                a.innerText = " " + d.toString();
                a.addEventListener("click", (evt) => {
                    // @ts-ignore
                    const key = evt.target.dataset["key"];
                    setDisplayDay(key);
                    setVisible(key);
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
            overviewAnchor.dataset["key"] = "overview";
            anchorPerDay["overview"] = overviewAnchor;

            function createCell(text, bgColor = "transparent") {
                const td = document.createElement("td");
                td.innerText = text;
                td.style.border = "1px solid #333";
                td.style.padding = "6px";
                td.style.textAlign = "center";
                td.style.backgroundColor = bgColor;
                return td;
            }

            function generateOverviewTable() {
                const deltaLeaderBoard = document.createElement("table");
                tablePerDay["overview"] = deltaLeaderBoard;

                deltaLeaderBoard.title = "Delta Leaderboard";
    
                let table = document.createElement("table");
                table.style.borderCollapse = "collapse";
                table.style.fontSize = "16px";

                function createDividerCell() {
                    const td = document.createElement("td");
                    td.innerHTML = "&nbsp;";
                    return td;
                }
    
                function createHeaderCell(text, color = "inherit", title = "") {
                    const th = document.createElement("th");
                    th.innerText = text;
                    th.title = title;
                    th.style.padding = "4px 8px";
                    th.style.color = color;
                    th.style.textAlign = "center";
                    th.style.cursor = "pointer";
                    return th;
                }
    
                {
                    // table header
                    let tr = table.appendChild(document.createElement("tr"));
                    tr.appendChild(createHeaderCell(""))
                    tr.appendChild(createHeaderCell("Stars"));
                    tr.appendChild(createHeaderCell(""))
                    tr.appendChild(createHeaderCell("Delta Points ⬇", "#ffff66"));
                    tr.appendChild(createDividerCell());
                    tr.appendChild(createHeaderCell("Mean*", "#ffff66", "deltas of more than 4 hours are not included"));
                    tr.appendChild(createHeaderCell("Median*", "#ffff66", "deltas of more than 4 hours are not included"));
                    tr.appendChild(createDividerCell());
                    for (let d = 1; d <= data.maxDay; ++d) {
                        let th = tr.appendChild(createHeaderCell(d));
                        th.style.fontSize = "11px";
                        th.style.minWidth = "14px";
                    }
                }

                let rank = 0;
                const divider = data.maxDeltaPoints * data.maxDeltaPoints; // Comparing quadratics makes distinctions clearer visually
                for (let member of data.members.slice().sort(deltaPointsTotalSorter).reverse()) {
                    const bgColor = member.isLoggedInUser ? aocColors["highlight"] : "transparent";
                    rank += 1;
                    let tr = table.appendChild(document.createElement("tr"));

                    let td = tr.appendChild(document.createElement("td"));
                    td.style.textAlign = "left";
                    td.innerText = rank + ". " + member.name;
                    td.style.border = "1px solid #333";
                    td.style.padding = "6px";
                    td.style.backgroundColor = member.isLoggedInUser ? aocColors["highlight"] : "transparent";

                    let tdStars = tr.appendChild(createCell(member.stars.length));
                    let percent = member.stars.length / 50 * 100;
                    tdStars.style.background = member.isLoggedInUser
                        ? aocColors["highlight"] 
                        : `linear-gradient(to right, rgb(255,255,255,0.05) 0%, rgb(255,255,255,0.05) ${percent}%, transparent ${percent}%, transparent 100%)`;
                    
                    tr.appendChild(createDividerCell());
                    tr.appendChild(createCell(member.deltaPointsTotal, bgColor));
                    tr.appendChild(createDividerCell());
                    tr.appendChild(createCell(member.deltaMeanSeconds ? formatTimeTaken(member.deltaMeanSeconds) : "", bgColor));
                    tr.appendChild(createCell(member.deltaMedianSeconds ? formatTimeTaken(member.deltaMedianSeconds) : "", bgColor));
                    tr.appendChild(createDividerCell());

                    for (let d = 1; d <= data.maxDay; ++d) {
                        const delta = member.deltas.find(x => x.dayNr === d);
                        const td = tr.appendChild(createCell(delta?.points || ""));
                        td.title = "Delta time: " + (delta ? formatTimeTaken(delta.deltaTimeTakenSeconds) : "none");
                        td.style.padding = "2px";
                        td.style.fontSize = "11px";
                        td.style.background = `rgba(255,255,255,${delta ? (delta.points * delta.points) / divider / 10  : 0})`;
                    }
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
                    th = tr.appendChild(createHeaderCell("completion", "----- Total -----"));
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

                const maxSecondsForSparkline = 4 /* hours */ * 3600;
                let rank = 0;
                let maxDeltaTime = Math.max.apply(Math, grid
                    .map(m => {
                        let memberStar1 = m.stars.find(s => s.dayNr === displayDay && s.starNr === 1);
                        let memberStar2 = m.stars.find(s => s.dayNr === displayDay && s.starNr === 2);
                        const delta = memberStar2 ? memberStar2.timeTakenSeconds - (memberStar1?.timeTakenSeconds || 0) : null;
                        return delta || 0 > maxSecondsForSparkline ? null : delta;
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

                    td = tr.appendChild(createCell(memberStar2 ? formatTimeTaken(memberStar2.timeTakenSeconds - (memberStar1?.timeTakenSeconds || 0)) : ""));
                    if (getTimeTableSort() === "delta") {
                        td.style.color = "#ffffff";
                        td.style.textShadow = "0 0 5px #ffffff";
                    }

                    if (memberStar2 && maxDeltaTime) {
                        const delta = memberStar2.timeTakenSeconds - (memberStar1?.timeTakenSeconds || 0);
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

        loadMedalOverview(/** @type {IAppData} */ data) {
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
            
            if (data.maxDay <= 0) {
                let noDataText = this.medals.appendChild(document.createElement("p"));
                noDataText.innerText = "No data available yet.";
                noDataText.style.color = aocColors["secondary"];
                return data;
            }

            let gridElement = document.createElement("table");
            gridElement.style.borderCollapse = "collapse";
            gridElement.style.fontSize = "16px";

            let grid = data.members;

            let tr = gridElement.appendChild(document.createElement("tr"));
            for (let d = 0; d <= 25; d++) {
                let td = tr.appendChild(document.createElement("td"));
                td.innerText = d === 0 ? "" : d.toString();
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
                td.innerText = member.name || "-";
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
                            div.style.opacity = `${0.5 + (0.5 * ((podiumLength - secondPuzzlePodiumPlace) / podiumLength))}`;
                        } else {
                            span.innerText = secondPuzzlePodiumPlace >= 0 ? `${(secondPuzzlePodiumPlace + 1)}` : '\u2003';
                            span.style.opacity = "0.25";
                        }
                    }
                }

                let separator = tr.appendChild(document.createElement("td"));
                separator.innerText = "\u00A0";

                for (let n = 0; n < podiumLength; n++) {
                    let td = tr.appendChild(document.createElement("td"));
                    td.innerText = `${member.podiumPlacesPerDay[n]}`;
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
            const container = document.createElement("div");
            container.style.position = "relative";
            container.style.maxWidth = "1600px";
            container.style.minWidth = "0px";
            container.style.minHeight = "0px";
            this.graphs.appendChild(container);
            const element = container.appendChild(document.createElement("canvas"));
            element.title = title;
            return element;
        }

        loadDayVsTime(/** @type {IAppData} */ data) {
            let datasets = data.members.map(m => {
                return {
                    label: m.name,
                    showInLegend: m.isLoggedInUser || m.rank < largeLeaderboardCutOff,
                    order: m.isLoggedInUser ? 0 : 1, // lower one gets drawn on top
                    backgroundColor: data.isLargeLeaderboard && !m.isLoggedInUser ? m.colorMuted : m.color,
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

            let chart = new Chart(element.getContext("2d"), {
                type: "scatter",
                data: {
                    datasets: datasets,
                },
                options: new ChartOptions(data, "Stars vs Log10(minutes taken per star)")
                    .withTooltips({
                        callbacks: {
                            label: (item) => {
                                const day = Math.floor(Number(item.parsed?.x || 0) + 0.5);
                                const star = Number(item.parsed?.x || 0) < day ? 1 : 2;
                                const mins = item.parsed?.y;
                                
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
                        grid: {
                            color: aocColors["tertiary"],
                        },
                    })
            });

            return data;
        }

        loadTimePerStar(/** @type {IAppData} */ data) {
            let datasets = [];
            let relevantMembers = data.members.sort((a, b) => b.score - a.score);

            relevantMembers.forEach( (member, idx) => {
                let star1DataSet = {
                    label: `${member.name} (★)`,
                    showInLegend: member.isLoggedInUser || member.rank < 10,
                    order: member.isLoggedInUser ? 0 : 1, // lower one gets drawn on top
                    pointStyle: member.pointStyle,
                    stack: `Stack ${member.name}`,
                    backgroundColor: member.color,
                    borderColor: "rgba(0, 0, 0, 0.5)",
                    borderWidth: 1,
                    data: /** @type {number[]} */ ([]),
                    hidden: data.loggedInUserIsPresumablyKnown ? !member.isLoggedInUser : idx >= 3,
                };

                let star2DataSet = {
                    label: `${member.name} (★★)`,
                    showInLegend: member.isLoggedInUser || member.rank < 10,
                    order: member.isLoggedInUser ? 0 : 1, // lower one gets drawn on top
                    pointStyle: member.pointStyle,
                    stack: `Stack ${member.name}`,
                    backgroundColor: member.colorMuted,
                    borderColor: "rgba(0, 0, 0, 0.5)",
                    borderWidth: 1,
                    data: /** @type {number[]} */ ([]),
                    hidden: data.loggedInUserIsPresumablyKnown ? !member.isLoggedInUser : idx >= 3,
                };

                for (let i = 1; i <= 25; i++) {
                    let star1 = data.stars.find(s => s.memberId === member.id && s.dayNr === i && s.starKey === "1");
                    let star2 = data.stars.find(s => s.memberId === member.id && s.dayNr === i && s.starKey === "2");

                    star1DataSet.data.push(!!star1 ? star1.timeTaken : 0);
                    star2DataSet.data.push(!!star2 ? star2.timeTaken - (star1?.timeTaken || 0) : 0);
                }

                datasets.push(star1DataSet);
                datasets.push(star2DataSet);
            });

            let element = this.createGraphCanvas(data, "From the top players, show the number of minutes taken each day. (Exclude results over 4 hours.) (Toggle Responsive for all users)");

            let options = new ChartOptions(data, `Minutes taken per star`)
                .withYScale({
                    max: 240,
                    ticks: {
                        fontColor: aocColors["main"],
                    },
                    grid: {
                        color: aocColors["tertiary"],
                    },
                });
            options.plugins.legend.title.text = "Top players";
            let chart = new Chart(element.getContext("2d"), {
                type: "bar",
                data: {
                    labels: range(1, 26),
                    datasets: datasets,
                },
                options,
            });

            return data;
        }

        /**
        * @param {IData} data
        */
        loadPointsOverTime(/** @type {IAppData} */ data) {
            const graphType = getPointsOverTimeType();
            const maxDayNr = Math.max(...data.stars.map(s => s.dayNr));
            const maxPointsPerDay = Array.from({ length: maxDayNr }, () => data.n_members * 2);

            // TODO: Perhaps do this while parsing so other graphs may use it?
            data.stars.forEach(s => maxPointsPerDay[s.dayNr-1] = s.points > 0 ? data.n_members * 2 : 0);
            const availablePoints = [maxPointsPerDay.map(p => p/2), maxPointsPerDay.map(p => p/2)];
            data.stars.forEach(s => availablePoints[s.starNr-1][s.dayNr-1] = Math.min(availablePoints[s.starNr-1][s.dayNr-1], Math.max(s.points-1, 0)));

            let datasets = data.members.sort((a, b) => a.name?.localeCompare(b.name || "") || 0).reduce((p, m) => {
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
                        showInLegend: m.isLoggedInUser || m.rank < (largeLeaderboardCutOff / 2),
                        order: m.isLoggedInUser ? 0 : 1, // lower one gets drawn on top
                        lineTension: 0.1,
                        fill: false,
                        borderWidth: m.borderWidth,
                        borderColor: data.isLargeLeaderboard && !m.isLoggedInUser ? m.colorMuted : m.color,
                        borderDash: [1, 4],
                        backgroundColor: data.isLargeLeaderboard && !m.isLoggedInUser ? m.colorMuted : m.color,
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
                    showInLegend: m.isLoggedInUser || m.rank < (largeLeaderboardCutOff / (graphType === 2 ? 2 : 1)),
                    order: m.isLoggedInUser ? 0 : 1, // lower one gets drawn on top
                    lineTension: 0.1,
                    fill: false,
                    borderWidth: m.borderWidth,
                    borderColor: data.isLargeLeaderboard && !m.isLoggedInUser ? m.colorMuted : m.color,
                    radius: m.radius,
                    pointStyle: m.pointStyle,
                    backgroundColor: data.isLargeLeaderboard && !m.isLoggedInUser ? m.colorMuted : m.color,
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
            }, /** @type any[] */ ([]));

            const element = this.createGraphCanvas(data, "Points over time per member.");

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
                options: new ChartOptions(data, `Points per Day - 🖱️ ${pointsOverTimeType[graphType]}`)
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
                    .withXTimeScale(data, { xMax: 25 })
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

        loadStarsOverTime(/** @type {IAppData} */ data) {
            let datasets = data.members.map(m => {
                return {
                    label: m.name,
                    showInLegend: m.isLoggedInUser || m.rank < largeLeaderboardCutOff,
                    order: m.isLoggedInUser ? 0 : 1, // lower one gets drawn on top
                    lineTension: 0.2,
                    fill: false,
                    borderWidth: m.borderWidth,
                    borderColor: data.isLargeLeaderboard && !m.isLoggedInUser ? m.colorMuted : m.color,
                    radius: m.radius,
                    pointStyle: m.pointStyle,
                    backgroundColor: data.isLargeLeaderboard && !m.isLoggedInUser ? m.colorMuted : m.color,
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

            let chart = new Chart(element.getContext("2d"), {
                type: "line",
                data: {
                    datasets: datasets,
                },
                options: new ChartOptions(data, "Leaderboard (stars)")
                    .withTooltips({
                        callbacks: {
                            afterLabel: (item) => {
                                const star = item.dataset.data[item.dataIndex].star;
                                return `(day ${star.dayNr} star ${star.starNr})`;
                            },
                        },
                    })
                    .withXTimeScale(data, { xMax: 31, titleText: "December" })
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

    if (document.readyState === "complete" || document.readyState === "interactive") {
        console.info(`Loading via readyState = ${document.readyState}`);
        loadAdditions();
    } else {
        console.info(`Loading via DOMContentLoaded because readyState = ${document.readyState}`);
        document.addEventListener("DOMContentLoaded", () => loadAdditions());
    }

}(window["aoc"] = window["aoc"] || {}));
