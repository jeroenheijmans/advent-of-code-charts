# Advent of Code Charts

This is an [unofficial](#license-and-affiliation-disclaimer) small hacked-up set of charts for a private leaderboard for [Advent of Code](https://adventofcode.com/).
Get it as an extension:

[![browser-store-chrome.png](readme-assets/browser-store-chrome.png)](https://chrome.google.com/webstore/detail/advent-of-code-charts/ipbomkmbokofodhhjpipflmdplipblbe) [![browser-store-firefox.png](readme-assets/browser-store-firefox.png)](https://addons.mozilla.org/en-US/firefox/addon/advent-of-code-charts/)

Prefer a userscript? Install [Tampermonkey](https://www.tampermonkey.net/) or Violentmonkey, then [install the user script](https://github.com/jeroenheijmans/advent-of-code-charts/releases/latest/download/advent-of-code-charts.user.js).
The extension is the recommended way though; the user script might be less well-tested (if it ever breaks, please do file an issue).

## Disclaimers

It is *not* a well-architectured, well-written, neat, nice, fluffy, industry-strength piece of code.
Instead it's something fun I wanted to make, stepping out of my *normal* way of coding. NO WARRANTY!

## Developing

Install dependencies:

```sh
npm ci # or npm install
```

Serve a test website with the dummy data:

```sh
npm run start # runs 'serve' and 'watch' in parallel
```

And open up the URL that's announced in the console.

## Building

Run `npm run build` to re-create a `/build/addon` folder which is a ready-to-go browser extension.
This also creates `build/userscript/advent-of-code-charts.user.js`, a single-file userscript you can install in a userscript manager like Tampermonkey or Violentmonkey (by opening the file in the manager or pasting it into a new script).
Test the extension by loading it in the browser.
For full reference, see Chrome's or Firefox's full documentation, but the basics are:

- Firefox: go to `about:debugging` and load a temporary addon (pick the `/build/addon` folder)
- Chrome: go to `chrome://extensions` and load unpacked extension (pick the `/build/addon` folder)

Test by browsing to a private leaderboard and you should see charts popping up at the bottom.

## Releasing

Bump the version in `addon-assets/manifest.json` first (the user script version is taken from it).

To release an addon to the store, for Chrome you just zip the `/build/addon` folder files into a file and submit it as a new version.

For the user script, create a GitHub Release with a new tag and attach `build/userscript/advent-of-code-charts.user.js` (keep the filename, the update URLs depend on it).

For Firefox, you need to add this to the manifest in the `/build/addon` folder first:

```json
    "browser_specific_settings": {
        "gecko": {
            "id": "{GUID-GUID-GUID-GUID}"
        }
    }
```

For details see [Mozilla's documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings) and [this Stack Overflow post](https://stackoverflow.com/q/56271601/419956) as to why it cannot be there by default.
(I suppose this step can be automated away later on.)

## License and Affiliation Disclaimer

The code in this project is MIT licensed, with the explicit exception of the `dummyData-*.js` files.
That file contains JSON in a format thought up by the owner and creator of Advent of Code, but we suppose that using a small snippet of it like this falls under "fair use" (given for one that the AoC website itself suggests using the "JSON API" for integrations, albeit without spamming that API).

Note that "Advent of Code" and "AoC" are Eric Wastl's.
This project is not "official", and in no way (directly or indirectly) endorsed by- or affiliated to Advent of Code and its creator/owner.
Read more [about Advent of Code](https://adventofcode.com/2018/about) to learn about the project itself.

**Oh, and of course, please [consider donating to _Advent of Code_ itself](https://adventofcode.com/support)!**

## Example

Here's what it should more or less look like:

![example-001.png](readme-assets/example-001.png)
![example-002.png](readme-assets/example-002.png)
![example-003.png](readme-assets/example-003.png)
![example-004.png](readme-assets/example-004.png)
![example-005.png](readme-assets/example-005.png)
![example-006.png](readme-assets/example-006.png)
