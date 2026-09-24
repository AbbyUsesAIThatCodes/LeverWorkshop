# Lever Workshop

A full-window 3D workbench for Engineering Essentials. Drag the two VEX IQ loads and their pivot, add gears, and explore what makes a lever balance.

![Lever Workshop exploration interface](docs/screenshots/workshop.png)

## Millimeter Lab companion

A separate millimeter-and-gram lab is available at `metric/` after building. It preserves the desk and camera, adds sliding masses and a hideable mechanical-advantage panel, and uses an explicitly ideal lever for exact 2:1 and 3:1 reasoning. See the [companion guide and verification](docs/MILLIMETER-LAB.md). Locally open <http://localhost:4173/LeverWorkshop/metric/>.

## Explore

- Drag a load or the pivot itself, or use its larger floating label. Parts snap to actual mounting columns and cannot cross one another.
- Add up to four alternating large/small gears on either load. Each gear brings its three pins. Point at a side slider to highlight its physical load, even from behind the lever.
- Drag the table to orbit a full 360°. Scroll or pinch to zoom; **Fit view** restores the starting camera.
- Use **Hold level** to arrange parts, then **Release**. Dragging a part holds the beam level until release.
- Keyboard users can select **Load A**, **Pivot**, or **Load B** and use the position slider. The gear sliders are keyboard accessible too.

This release has one exploration interface. Guided progression and Challenge mode from the first prototype have been removed. The next Challenge PR is specified in the [roadmap](docs/ROADMAP.md).

The model includes the beam, connectors, brackets, gears, pins, their centers of mass, and rotational inertia. **Its masses and friction remain approximate until compared with a classroom build.** Teacher settings accept measured masses. It is a simulation, with no sensor connection to the real lever. See the [teacher guide](docs/TEACHER-GUIDE.md) and [mechanics notes](docs/MECHANICS.md).

## Run locally

Use Node.js 22 or later.

```sh
npm ci
npm run build
npm run dev
```

Open <http://localhost:4173/LeverWorkshop/>. Serve `dist/` through HTTP; opening `index.html` with `file://` cannot load the part assets.

```sh
npm test
npx playwright install chromium
npm run test:browser
```

The browser test starts its own server when needed. `CHROMIUM_EXECUTABLE` optionally selects an existing Chromium binary. `BROWSER_SOFTWARE_GL=1` enables software WebGL on headless Linux.

## GitHub Pages

The game address is **<https://abbyusesaithatcodes.github.io/LeverWorkshop/>**. The repository address shows code and the README, not the game.

In **Settings → Pages**, the source is **GitHub Actions**. After the PR is reviewed and merged, a push to `main` runs **Deploy Pages**, builds the site, and publishes `dist/`. PR checks do not deploy. The live site keeps its previous version until a merge and successful deployment.

Everything is served locally from the static site: meshes, fonts, and JavaScript. No accounts, backend, analytics, or runtime CDN. The current arrangement and model settings are saved only in this browser; old lesson-progress records are ignored. Exploration also works without storage and has a diagram fallback if WebGL cannot start.

## Structure

- `src/assembly.js`: mounting rules, component transforms, mass recipes.
- `src/part-properties.json`: CAD volume, centroid, and inertia measurements.
- `src/model.js`: gravity, rotation, contact bounds, and saved-state validation.
- `src/scene.js`: original part meshes, lighting, camera, and direct dragging.
- `src/app.js`: overlay controls, settings, and diagram fallback.
- `public/`: page, styles, and compressed meshes.
- `docs/`: teacher guide, mechanics, validation, future scope, and CAD provenance.
- `tests/`: geometry, mechanics, and browser interaction checks.

See [third-party notices](THIRD_PARTY_NOTICES.md). VEX Robotics is not affiliated with this independent classroom project. Learning Compass integration is future work.
