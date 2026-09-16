# Credits and third-party material

## Bruce Lee (1984)

Original game published by Datasoft. Original game code, characters, artwork and music retain their original ownership; this repository does not grant a new license to that material.

The gameplay checkpoint and room thumbnails derive from the C64 version available at [c64.krissz.hu](https://c64.krissz.hu/bruce-lee/play-online/). The checkpoint starts after loading, in single-player mode with the trainer declined. Reference gameplay was supplied by the user: [YouTube longplay](https://www.youtube.com/watch?v=jHzW7T-bwBc).

## Viciious

Hardware runtime from [luxocrates/viciious](https://github.com/luxocrates/viciious), revision `69f0dc672c1dba46382065f2f4ed1631440f98b0`.

Upstream states that its emulation code and UI assets were authored from scratch and placed in the public domain. Vendored modules are under `src/vendor/c64`; local changes add explicit `.js` import extensions. The new host adapter supplies video, input and audio callbacks and steps the hardware at PAL frame intervals. Upstream ROM sources, demos and Lorenz test programs are excluded.

## Three.js

Copied from the owner's local `C:\Projects\3js\build` directory. Copyright the Three.js authors; MIT license included at `src/vendor/THREE-LICENSE.txt`.

## DM Sans

Locally hosted DM Sans fonts. See `public/fonts/OFL.txt` for the SIL Open Font License.

## New presentation

The browser interface, Three.js scenery, input adapter, practice selector and integration tests were created for this fan project. No license in this repository overrides the ownership of the original game or other third-party components.

## Jade Forest Path

`public/audio/jade-forest-path.mp3` was supplied by the project owner for use as the game’s background music. Ownership remains with its creator; no broader reuse license is granted here.
