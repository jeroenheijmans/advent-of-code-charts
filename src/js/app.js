(function(aoc) {
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

    class App {
        constructor(dal) {
            dal.getLeaderboardJson()
                .then(data => this.loadStarsOverTime(data))
                .then(data => this.loadPointsOverTime(data))
                .then(data => this.loadTimePerStar(data));
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


            let pointsOverTimeChart = new Chart(document.getElementById("timePerStar").getContext("2d"), {
                type: "bar",
                data: {
                    labels: _.range(1, 26),
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    legend: {
                        position: "left",
                    },
                    title: {
                        display: true,
                        text: `Log10(minutes) taken per star (top ${n} players)`,
                        fontSize: 24,
                    },
                    scales: {
                        xAxes: [{
                            stacked: true,
                        }],
                        yAxes: [{
                            stacked: true,
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

            let pointsOverTimeChart = new Chart(document.getElementById("pointsOverTime").getContext("2d"), {
                type: "line",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    legend: {
                        position: "left",
                    },
                    title: {
                        display: true,
                        text: "Points over time",
                        fontSize: 24,
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
                        }],
                        yAxes: [{
                            ticks: {                               
                                min: 0,
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

            let starsOverTimeChart = new Chart(document.getElementById("starsOverTime").getContext("2d"), {
                type: "line",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    legend: {
                        position: "left",
                    },
                    title: {
                        display: true,
                        text: "Stars over time",
                        fontSize: 24,
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
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                stepSize: 1,
                                min: 0,
                            },
                        }],
                    }
                }
            });

            return data;
        }
    }

    aoc["App"] = App;
}(window.aoc = window.aoc || {}));