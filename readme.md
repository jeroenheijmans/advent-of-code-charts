# Advent of Code Charts

This is a small hacked-up set of charts for a private leaderboard for [Advent of Code](https://adventofcode.com/).

## Disclaimers

It is *not* a well-architectured, well-written, neat, nice, fluffy, industry-strength piece of code. Instead it's something fun I wanted to make, stepping out of my *normal* way of coding. NO WARRANTY!

## Developing

Install global dependencies:

```sh
npm install --global serve livereload
```

Then run both `npm serve src/.` and `npm livereload src/.` and open up `http://localhost:5000`. You should see a test website with the dummy data.

## Building

If you insist on making a build testable as a Chrome extension, run the `build.ps1` (at your own risk!) or create a bash equivalent.

Then follow Chrome's instructions on adding a developer mode extension, straight from the `build/` folder.

Test by browsing to a private leaderboard and you should see charts popping up at the bottom.
