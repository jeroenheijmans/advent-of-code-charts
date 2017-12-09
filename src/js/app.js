(function(aoc) {
    class App {
        constructor(dal) {
            dal.getLeaderboardJson()
                .then(data => this.loadStarsOverTime(data))
                .then(data => this.loadPointsOverTime(data));
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
                    responsive: false,
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
                                max: data.maxMoment,
                                unit: "day", 
                                stepSize: 1,
                            },
                        }],
                        yAxes: [{
                            ticks: {
                                stepSize: 5,
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
                    responsive: false,
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
                                max: data.maxMoment,
                                unit: "day", 
                                stepSize: 1,
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                stepSize: 1,
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