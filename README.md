# Bruce Lee · The Dragon Returns

[Play the game](https://andredp-developer.github.io/bruce-lee/)

A single-player browser edition of the 1984 C64 Bruce Lee adventure. All 20 original rooms, lantern puzzles, enemies, traps, wizard and treasure-room ending are included. Three.js presents the original pixels with optional smoothing, atmospheric scenery, lantern glow and scanlines.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | Left / right arrows or A / D |
| Jump / climb | Up arrow or W; X also jumps |
| Duck / climb down | Down arrow or S |
| Fight | Space, Z or Shift |
| Start / continue | Enter |
| Pause | P or Escape |
| Sound / fullscreen | M / F |
| Practice selector | F2 |

Touch controls are available on smaller screens. Standard gamepad mappings are supported: stick / D-pad to move, A to jump, B or X to fight, Start to pause. A physical gamepad has not been tested.

Collect the lanterns in the first three courtyards, then return to the middle courtyard's hatch. The Ninja and Green Yamo are controlled by the game and respawn. There is no second-player control. Practice rooms and practice protection mark a run as assisted and disable personal-best updates.

## Local development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
npm test
npm run build
```

The local server uses port 5174. The production output is `dist/`. GitHub Actions runs the integration tests and publishes that directory to GitHub Pages.

## How this edition works

The presentation is new Three.js code, using the Three.js build copied from the owner's local `C:\Projects\3js`. Gameplay runs the original C64 program and room data through the public-domain Viciious hardware runtime. This preserves the game's actual room connections and puzzle routines instead of approximating them with newly invented levels.

`public/data/start.json` is a native single-player starting checkpoint, with the trainer disabled and five lives. The game banks out system ROMs; BASIC, KERNAL and character ROM files are not included. The Three.js renderer uses the original 320 × 176 playfield. Original mode disables the atmospheric scenery; pixel smoothing is a separate option.

Sound now renders the native SID register/envelope stream into audio samples during CPU execution. It preserves pulse width, triangle and saw waveforms, pitch-dependent noise, and within-frame register changes. Collection, movement and combat retain the original game's sound triggers. Background music has been removed from playback while effects are being corrected. Settings retain an effects volume slider.

The requested game-sound reference is https://www.youtube.com/watch?v=gRGGWWvvO0o; the music reference for future work is https://www.youtube.com/watch?v=B2z_igQI4yk. No audio was copied from these videos. Exact matching by ear has not been verified. This is still an approximate SID renderer: analog filter behaviour, oscillator sync and ring modulation are not reproduced.

## Verification

The repeatable integration suite checks:

- Normal movement and the first courtyard transition using game inputs.
- All 20 rooms rendering distinct frames and continuing to run with input.
- All 89 lanterns and the wizard switch through the original collision routines.
- 37 native exit dispatches reaching their configured destination rooms.
- Final switch activation followed by movement into the treasure room.
- Both computer enemies spawning and damaging Bruce.
- Pause, restart, practice validation and game-over state handling.

Collection and exit checks use assisted positioning / boundary fixtures. These are integration checks, **not a complete unassisted playthrough**, and they do not prove that every route has been traversed by normal inputs. Browser checks cover opening all 20 practice rooms, desktop and phone layouts, presentation settings and console errors.

Reference: [the supplied longplay](https://www.youtube.com/watch?v=jHzW7T-bwBc). See [THIRD_PARTY.md](THIRD_PARTY.md) for source and ownership notices. This is an unofficial fan project.
