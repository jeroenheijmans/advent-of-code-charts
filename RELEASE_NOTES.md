# Release notes

Some adhoc release notes for changes made, in reverse chronological order.

## 2023 AoC edition

### 2023-12-22 Mozilla FireFox update

- Reviewers at Mozilla had requested we'd remove [the MomentJS workaround](https://github.com/jeroenheijmans/advent-of-code-charts/commit/6ea4669fe5588629e110db055313b9c772ba8331) we needed thus far, and it was possible since ChartJS had received updates in the past it seems. So we did a FireFox-only release to patch this

### 2023-12-01 Bugfix

- Issue #95, bug with incorrect gold medal counts (thanks for reporting @diogotcorreia and submitting a PR to fix it @FXCourel)

### 2023-11-xx November fixes

- Issue #87 was fixed, tooltips in 3rd graph now work properly again
- Issue #91 was implemented, a "no data" message is displayed when there is no data (yet)
- PR #94 implements issue #93: "Full Screen" mode, to showcase a leaderboard on a monitor/screen

### 2023-xx-xx Q1 fixes

A bunch of fixes early in the year.

List of fixes for #79, the 2023 updates:

- PR #55 to add highlighting of yourself (the leaderboard owner) in various places
- PR #78 to fix edge cases when the star timestamp is exactly the same for two users
- Issue #56 and PR #61 to improve seeing Medals on older systems with less modern fonts
- PR #62 to improve the final chart with time taken per stars
- Issue #76 to show star times even if they are beyond 240 minutes (just show 'em clipped)
- PR #73 and issue #4 to refactor the chart options and DRY them up a bit
- PR #60 with new variants of the Points-Per-Day graph
- Issue #81 update Chart.js and other dependencies
- Issue #33 make (double) clicking legend items more discoverable
- PR #58 to add more Delta-Time leaderboard features
- See issue #54: rolled back to manifest v2 for now

Further 2023 Q1 fixes and changes:

- Issue #70 to improve situation for large and huge leaderboards

## 2022 and before

There are no release notes from 2022 and before, except what can be found on Reddit and other various places.