# Advent of Code Charts

This is a small hacked-up set of charts for a private leaderboard for [Advent of Code](https://adventofcode.com/).

## Disclaimers

It is *not* a well-architectured, well-written, neat, nice, fluffy, industry-strength piece of code.
Instead it's something fun I wanted to make, stepping out of my *normal* way of coding. NO WARRANTY!

## Developing

Install global dependencies:

```sh
npm install --global serve livereload
```

Then run both `serve src/.` and `livereload src/.` and open up `http://localhost:5000`. You should see a test website with the dummy data.

## Building

If you insist on making a build testable as a Chrome extension, run the `build.ps1` (at your own risk!) or create a bash equivalent.

Then follow Chrome's instructions on adding a developer mode extension, straight from the `build/` folder.

Test by browsing to a private leaderboard and you should see charts popping up at the bottom.

## License and Affiliation Disclaimer

The code in this project is MIT licensed, with the explicit exception of `dummyData.js`.
That file contains JSON in a format thought up by the owner and creator of Advent of Code, but we suppose that using a small snippet of it like this falls under "fair use" (given for one that the AoC website itself suggests using the "JSON API" for integrations, albeit without spamming that API).

Note that "Advent of Code" and "AoC" are Eric Wastl's.
This project is not "official", and in no way (directly or indirectly) endorsed by- or affiliated to Advent of Code and its creator/owner.
Read more [about Advent of Code](https://adventofcode.com/2018/about) to learn about the project itself.

**Oh, and of course, please [consider donating to _Advent of Code_ itself](https://adventofcode.com/2018/support)!**
