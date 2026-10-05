Command &amp; Conquer - HTML5
=============================

## About

This is a recreation of the original Command and Conquer, Real Time Strategy game entirely in HTML5 and Javascript.

This project is only intended as a technical proof of concept to demonstrate the basic working elements of an RTS game in HTML5. No commercial use is intended. All images and sounds used are from C&C - Tiberian Dawn and are property of the original game creators.

This game works best on Google Chrome or Mozilla Firefox. The images can take a little while to load so please be patient.

## Running the game

The game is built from native ES modules, so it has to be served over HTTP.
Opening `index.html` directly from the filesystem will not work because
browsers block module loading on `file://` URLs.

```
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

There is no build step and no dependencies. `index.html` loads `js/main.js`
as a module, which boots the game.

## Project layout

```
index.html          entry document
js/main.js          module entry point, boots the game
js/core/dom.js      canvas + debug panel elements (leaf of the import graph)
js/core/            assets, entity model, grid queries, geometry, A*
js/game/            game loop, input, sidebar, units, buildings, levels, ...
tools/smoke-test.mjs headless test for the module graph and game state
```

Import cycles between subsystems are expected: game state is held in shared
singleton objects, and functions reference each other across modules. Because
modules resolve before they evaluate, these are safe as long as the values are
only touched inside function bodies, which is how the code is written.

## Tests

```
node tools/smoke-test.mjs
```

The test stubs out the DOM, canvas, audio and image loading, then boots the
real modules and exercises level loading, preloading, animation frames, mouse
and keyboard input, control groups, the debug panel, the sidebar dependency
checks and pathfinding.

## Notes & Demo URL

You can find a working demo of this project on http://www.adityaravishankar.com/projects/games/command-and-conquer-demo/

Details and notes about the development of the project are available on my website at http://www.adityaravishankar.com/2011/11/command-and-conquer-programming-an-rts-game-in-html5-and-javascript/

NOTE: The source code shared here is from the earlier demo version of the project. This version is no longer being developed and the code is being shared so others can learn from it.

## Newer Version & Updates

A more recent version of the project is available here. http://www.adityaravishankar.com/projects/games/command-and-conquer/

This version is a complete rewrite of the earlier demo shared on github.

The new version has more levels from the original game, more units, explosions, effects and background music. Multiplayer support is also being tested using Node.js & nowjs. 

[Demo Video](http://www.youtube.com/watch?v=HTZCMxNtloQ)

This new version is NOT open source. It is still free to play. 

News, updates, screenshots, videos and invites to beta releases are available on the [C&C HTML5 Facebook page](http://www.facebook.com/CommandConquerHtml5)
