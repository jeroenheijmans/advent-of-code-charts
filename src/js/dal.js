(function(aoc) {
    class Dal {
        GetLeaderboardJson() {
            return new Promise((resolve, reject) => {
                setTimeout(() => resolve(dummyData));
            }, 100);
        }
    }

    aoc["Dal"] = Dal;
}(window.aoc = window.aoc || {}));