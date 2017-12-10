(function(aoc) {
    const aocColors = {
        "main": "rgba(200, 200, 200, 0.9)",
        "secondary": "rgba(150, 150, 150, 0.9)",
        "tertiary": "rgba(100, 100, 100, 0.5)",
    };

    function range(from, to) {
        return [...Array(to - from).keys()].map(k => k + 1 + from);
    }

    function hexToRGB(hex, alpha) {
        // By @AJFarkas, from https://stackoverflow.com/a/28056903/419956

        var r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);

        if (alpha) {
            return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
        } else {
            return "rgb(" + r + ", " + g + ", " + b + ")";
        }
    }
    
    function starSorter(a, b) { 
        return a.getStarTimestamp.localeCompare(b.getStarTimestamp); 
    }

    function getPalette(n) {
        // Including google/palette seems hard because there is no CDN so we just use this trick:
        const basePalette = ["#781c81", "#6e1980", "#65187f", "#5e187e", "#58197e", "#531b7f", "#4f1d81", "#4c2182", "#492484", "#462987", "#442d8a", "#43328d", "#423791", "#413d94", "#404298", "#3f489c", "#3f4ea0", "#3f53a5", "#3f59a9", "#3f5fad", "#4064b1", "#4069b5", "#416fb8", "#4274bb", "#4379be", "#447dc0", "#4582c1", "#4686c2", "#488ac2", "#4a8ec1", "#4b92c0", "#4d95be", "#4f99bb", "#519cb8", "#549fb4", "#56a2b0", "#58a4ac", "#5ba7a7", "#5ea9a2", "#60ab9d", "#63ad98", "#66af93", "#69b18e", "#6cb289", "#70b484", "#73b580", "#77b67b", "#7ab877", "#7eb973", "#82ba6f", "#85ba6b", "#89bb68", "#8dbc65", "#91bd61", "#95bd5e", "#99bd5c", "#9dbe59", "#a1be56", "#a5be54", "#a9be52", "#adbe50", "#b1be4e", "#b5bd4c", "#b9bd4a", "#bcbc48", "#c0bb47", "#c3ba45", "#c7b944", "#cab843", "#cdb641", "#d0b540", "#d3b33f", "#d6b13e", "#d8ae3d", "#dbab3c", "#dda93b", "#dfa53a", "#e0a239", "#e29e38", "#e39a37", "#e49636", "#e59235", "#e68d34", "#e78833", "#e78332", "#e77d31", "#e77730", "#e7712f", "#e66b2d", "#e6642c", "#e55e2b", "#e4572a", "#e35029", "#e24928", "#e14226", "#df3b25", "#de3424", "#dc2e22", "#db2721", "#d92120"];
        let step = basePalette.length / n;
        return [...Array(n).keys()].map(i => basePalette[Math.floor(i * step, 0)]);
    }

    function transformRawAocJson(json) {
        let stars = [];

        let members = Object.keys(json.members)
            .map(k => json.members[k])
            .map(m => {
                let i = 0;
                m.stars = [];

                for (let dayKey of Object.keys(m.completion_day_level)) {
                    for (let starKey of Object.keys(m.completion_day_level[dayKey])) {
                        let starMoment = moment(m.completion_day_level[dayKey][starKey].get_star_ts).utc();

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
                        };

                        stars.push(star);
                        m.stars.push(star);
                    }
                }

                m.stars = m.stars.sort(starSorter);

                m.stars.forEach((s, idx) => {
                    s.nrOfStarsAfterThisOne = idx + 1;

                    let startOfDay = moment.utc([2017, 11, s.dayNr, 5, 0, 0]); // AoC starts at 05:00 UTC
                    s.timeTaken = s.getStarMoment.diff(startOfDay, "minutes");
                });

                return m;
            })
            .filter(m => m.stars.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));

        let colors = getPalette(members.length);
        members.forEach((m, idx) => m.color = colors[idx]);

        let allMoments = stars.map(s => s.getStarMoment).concat([moment("2017-12-25T00:00:00-0000")]);
        let maxMoment = moment.min([moment.max(allMoments), moment("2017-12-31T00:00:00-0000")]);

        let availablePoints = {};

        for (let i = 1; i <= 25; i++) {
            availablePoints[i] = {};
            for (let j = 1; j <= 2; j++) {
                availablePoints[i][j] = members.length;
            }
        }

        let orderedStars = stars.sort(starSorter);

        let rawDataSets = {};

        for (let star of orderedStars) {
            star.points = availablePoints[star.dayKey][star.starKey]--;
        }

        for (let m of members) {
            let accumulatedPoints = 0;
            for (let s of m.stars.sort(starSorter)) {
                accumulatedPoints += s.points;
                s.nrOfPointsAfterThisOne = accumulatedPoints;
                m.score = accumulatedPoints;
            }
        }

        return{
            maxMoment: maxMoment,
            stars: stars,
            members: members
        };
    }

    function getLeaderboardJson() {
        // 1. Check if dummy data was loaded...
        if (!!aoc.dummyData) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(transformRawAocJson(aoc.dummyData));
                });
            }, 100);
        }
        // 2. Apparently we can use real calls...
        else {
            let url = document.querySelector("#api_info a").href;
            return fetch(url, { credentials: "same-origin" })
                .then(data => data.json())
                .then(json => transformRawAocJson(json));
        }
    }

    class App {
        constructor() {
            this.wrapper = document.createElement("div");
            
            document.body.appendChild(this.wrapper);

            getLeaderboardJson()
                .then(data => this.loadPointsOverTime(data))
                .then(data => this.loadStarsOverTime(data))
                .then(data => this.loadDayVsTime(data))
                .then(data => this.loadTimePerStar(data));
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
                            y: Math.log10(s.timeTaken)
                        };
                    })
                };                
            });

            let element = document.createElement("canvas");
            this.wrapper.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "scatter",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    legend: {
                        position: "right",
                        labels: {
                            fontColor: aocColors["main"],
                        },
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
            let relevantMembers = data.members.sort((a,b) => b.score - a.score).slice(0,n);

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
                    backgroundColor: hexToRGB(member.color, 0.7),
                    data: [],
                };

                for (let i = 1; i <= 25; i++) {
                    let star1 = data.stars.find(s => s.memberId === member.id && s.dayNr === i && s.starKey === "1");
                    let star2 = data.stars.find(s => s.memberId === member.id && s.dayNr === i && s.starKey === "2");

                    star1DataSet.data.push(!!star1 ? star1.timeTaken : 0);
                    star2DataSet.data.push(!!star2 ? star2.timeTaken - star1.timeTaken : 0);
                }

                // Workaround for bug with "logarithmic" axes: https://github.com/chartjs/Chart.js/issues/4934
                star1DataSet.data = star1DataSet.data.map(x => Math.log10(x));
                star2DataSet.data = star2DataSet.data.map(x => Math.log10(x));

                datasets.push(star1DataSet);
                datasets.push(star2DataSet);
            }

            let element = document.createElement("canvas");
            this.wrapper.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "bar",
                data: {
                    labels: range(1, 25),
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    legend: {
                        position: "right",
                        labels: {
                            fontColor: aocColors["main"],
                        },
                    },
                    title: {
                        display: true,
                        text: `Log10(minutes taken per star) of top ${n} players`,
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
                                labelString: "minutes taken per star (log scale)",
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

        loadPointsOverTime(data) {
            let datasets = data.members.map(m => {
                return {
                    label: m.name,
                    cubicInterpolationMode: "monotone",
                    fill: false,
                    borderWidth: 1.5,
                    borderColor: m.color,
                    backgroundColor: m.color,
                    data: m.stars.map(s => {
                        return {
                            x: s.getStarMoment,
                            y: s.nrOfPointsAfterThisOne,
                        }
                    })
                };
            });

            let element = document.createElement("canvas");
            this.wrapper.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "line",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    legend: {
                        position: "right",
                        labels: {
                            fontColor: aocColors["main"],
                        },
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
                                min: moment([2017,10,30,5,0,0]),
                                max: data.maxMoment,
                                unit: "day",
                                stepSize: 1,
                                displayFormats: { day: "D" },
                            },
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
                            ticks: {
                                min: 0,
                                fontColor: aocColors["main"],
                            },
                            scaleLabel: {
                                display: true,
                                labelString: "cumulative points",
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
                    cubicInterpolationMode: "monotone",
                    fill: false,
                    borderWidth: 1.5,
                    borderColor: m.color,
                    backgroundColor: m.color,
                    data: m.stars.map(s => {
                        return {
                            x: s.getStarMoment,
                            y: s.nrOfStarsAfterThisOne
                        };
                    }),
                }
            });

            let element = document.createElement("canvas");
            this.wrapper.appendChild(element);

            let chart = new Chart(element.getContext("2d"), {
                type: "line",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    legend: {
                        position: "right",
                        labels: {
                            fontColor: aocColors["main"],
                        },
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
                                min: moment([2017,10,30,5,0,0]),
                                max: data.maxMoment,
                                unit: "day",
                                stepSize: 1,
                                displayFormats: { day: "D" },
                            },
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
        new aoc.App();
    }
    
    if (document.readyState === "complete" || document.readyState === "loaded") {
        loadAdditions();
    } else {
        document.addEventListener("DOMContentLoaded", () => loadAdditions());
    }

}(window.aoc = window.aoc || {}));