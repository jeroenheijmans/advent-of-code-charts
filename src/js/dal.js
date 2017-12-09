(function (aoc) {
    const dummyData = {
        "members": {
            "190664": {
                "name": "Jeroen Heijmans",
                "local_score": 18,
                "last_star_ts": "2017-12-09T01:45:41-0500",
                "completion_day_level": {
                    "1": {
                        "1": {
                            "get_star_ts": "2017-12-01T00:06:53-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-01T00:21:28-0500"
                        }
                    },
                    "2": {
                        "1": {
                            "get_star_ts": "2017-12-02T04:03:37-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-02T04:11:25-0500"
                        }
                    },
                    "3": {
                        "1": {
                            "get_star_ts": "2017-12-03T15:04:39-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-03T15:41:16-0500"
                        }
                    },
                    "4": {
                        "1": {
                            "get_star_ts": "2017-12-04T00:05:13-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-04T00:16:12-0500"
                        }
                    },
                    "5": {
                        "1": {
                            "get_star_ts": "2017-12-05T00:12:36-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-05T00:14:52-0500"
                        }
                    },
                    "6": {
                        "1": {
                            "get_star_ts": "2017-12-06T00:30:17-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-06T00:40:01-0500"
                        }
                    },
                    "7": {
                        "1": {
                            "get_star_ts": "2017-12-07T00:49:49-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-07T02:22:52-0500"
                        }
                    },
                    "8": {
                        "1": {
                            "get_star_ts": "2017-12-08T00:30:42-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-08T00:33:27-0500"
                        }
                    },
                    "9": {
                        "1": {
                            "get_star_ts": "2017-12-09T01:37:35-0500"
                        },
                        "2": {
                            "get_star_ts": "2017-12-09T01:45:41-0500"
                        }
                    }
                },
                "stars": 18,
                "global_score": 0,
                "id": "190664"
            }
        },
        "owner_id": "190664",
        "event": "2017"
    };

    const starSorter = (a, b) => a.getStarTimestamp.localeCompare(b.getStarTimestamp);

    class Dal {
        getLeaderboardJson() {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    let stars = [];

                    let members = _.values(dummyData.members)
                        .map(m => {
                            let i = 0;
                            m.stars = [];

                            for (let dayKey of Object.keys(m.completion_day_level)) {
                                for (let starKey of Object.keys(m.completion_day_level[dayKey])) {
                                    let star = {
                                        memberId: m.id,
                                        day: dayKey,
                                        starKey: starKey,
                                        getStarDay: parseInt(`${dayKey}.${starKey}`, 10),
                                        getStarTimestamp: m.completion_day_level[dayKey][starKey].get_star_ts,
                                        getStarMoment: moment(m.completion_day_level[dayKey][starKey].get_star_ts),
                                    };
                                    stars.push(star);
                                    m.stars.push(star);
                                }
                            }

                            m.stars = m.stars.sort(starSorter);
                            m.stars.forEach((s, idx) => s.nrOfStarsAfterThisOne = idx + 1);

                            return m;
                        })
                        .filter(m => m.stars.length > 0)
                        .sort((a, b) => a.name.localeCompare(b.name));

                    let colors = palette('tol-rainbow', members.length).map(c => `#${c}`);
                    members.forEach((m, idx) => m.color = colors[idx]);

                    let allMoments = stars.map(s => s.getStarMoment).concat([moment("2017-12-05T00:00:00-0000")]);
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
                        star.points = availablePoints[star.day][star.starKey]--;
                    }

                    for (let m of members) {
                        let accumulatedPoints = 0;
                        for (let s of m.stars.sort(starSorter)) {
                            accumulatedPoints += s.points;
                            s.nrOfPointsAfterThisOne = accumulatedPoints;
                        }
                    }

                    resolve({
                        maxMoment: maxMoment,
                        stars: stars,
                        members: members
                    });
                });
            }, 100);
        }
    }

    aoc["Dal"] = Dal;
}(window.aoc = window.aoc || {}));