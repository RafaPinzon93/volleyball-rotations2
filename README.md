# Sideout — Volleyball Rotation Lab

Open **volleyball-trainer.html** in a modern browser for the portable, single-file version. You can copy or share that HTML file by itself. No installation or server is required.

For editing, use **index.html** with `app.js`, `styles.css`, and `vendor/gsap.min.js` beside it. Run `python3 build_standalone.py` after changes to refresh the single-file version. The animation library is included locally; optional Google Fonts fall back to system fonts offline.

## GitHub Pages

Site URL: https://rafapinzon93.github.io/volleyball-rotations2/

The workflow in `.github/workflows/pages.yml` builds the portable trainer and publishes it as the site's `index.html` on every push to `main`. Only the generated website is included in the Pages artifact. You can also run the workflow manually from the repository's Actions tab.

GitHub Pages must use **GitHub Actions** as its publishing source. To publish future edits, commit the source changes and push to `main`; the workflow regenerates the standalone HTML automatically.

## Explore

- Switch between **5–1** and **6–2**, and choose any of the six rotations.
- Focus on a role or select an individual player on the court. F / B badges indicate front- and back-row status.
- Play, pause, scrub, or jump to a rally phase. Speed ranges from **0.25× to 2×** and can change during playback.
- Toggle movement paths, zone numbers, and libero replacements.
- With **Continue rotations** enabled, each completed example advances to the next rotation. Disable it to stop at the end of one example.
- Press **Space** to play/pause or **← / →** to change rotations when focus is outside a control. All controls and court players also support keyboard navigation.
- Open **How it works** for the field guide. Reduced-motion preferences shorten player transitions; playback never starts automatically.

## Teaching model

These are simplified receiving-rally examples, not a complete match simulation or a prescribed serve-receive formation. Every example uses a pass from the back-row middle/libero, a set to the front-row outside, and a successful attack. The team then rotates because it won the right to serve. The next lesson assumes the team is receiving again; serving rallies between lessons are omitted.

The 5–1 uses one setter throughout. The 6–2 uses two opposite setter/hitters without substitutions: the back-row setter sets, and the front-row setter plays right-side hitter. The optional libero replaces a back-row middle. Actual libero exchanges are condensed at the end of the rotation animation; competition timing and service rules are not simulated. Paths are schematic, not collision-free coaching routes. Before serve contact, the diagram preserves receiving-team row and lateral order.

Rules reference: [USA Volleyball](https://usavolleyball.org/play/rules-of-volleyball/).

Animation: [GSAP 3.13.0](https://gsap.com/docs/v3/GSAP/Timeline/), stored locally with its original license header. Its timeline API handles pause, seek, and playback speed. See the [GSAP standard license](https://gsap.com/standard-license/).
