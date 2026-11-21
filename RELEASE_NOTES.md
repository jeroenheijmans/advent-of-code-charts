# Release notes

Some adhoc release notes for changes made, in reverse chronological order.

# 2026 AoC edition

### 2026-11-21 Various updates

- Updated Chart.js (4.6.1) and MomentJS (2.31.0), which also fixes a MomentJS security advisory
- Data cache TTL raised from 5 to 15 minutes, as requested by the AoC organizer
- Dev tooling: `npm-run-all` replaced by `concurrently`, `.npmrc` now sets a minimum release age of 4 days
- Fixed players with only 1 star not showing up
- Full-screen mode can now also be closed with the Escape key
- Better 12-day event support, plus an extra 12-day "finished" dummy data set
- Performance improvements, especially for large leaderboards
- Cumulative total of stars across all members as bars on second chart
- Repurpose chart 4 to show more interesting "Delta Times" stats
- Added a user script build (Tampermonkey, Violentmonkey) as an alternative to the extension option.
- Build scripts replaced by a cross-platform `npm run build`, output now in `build/addon` and `build/userscript`

## 2025 AoC edition

### 2025-12-06 Version 7.1.0

- Support for the 12-day event format (also added a 12-day dummy data set)

# 2024 AoC edition

# 2024-12-07

- Issue #105, Firefox error on first load fix

# 2024-11-xx November fixes

- Issue #54, upgrade to Manifest v3 was fixed

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