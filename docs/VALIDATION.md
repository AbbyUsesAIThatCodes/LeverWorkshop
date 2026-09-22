# Validation · exploration interface

## Mechanics and geometry

`npm test`: 11 passing tests at the time of this update.

- All 11 compressed CAD buffers contain finite vertices/normals and match declared bounds. The actual offset mesh contains the lower-hole ring centered halfway between its mounting pins.
- All 969 legal mounting triples preserve the two reserved pivot columns under every tested move, including out-of-range and fractional input.
- Both offset connectors' measured lower-hole centers share the shaft axis at every permitted pivot location and remain on that axis during rotation.
- Gear counts, added pins, and complete-load masses agree for all five load settings.
- Equal end loads balance from level at the central mounting pair. More mass, a longer arm, and an off-center pivot change turning direction as expected.
- Beam self-weight contributes to torque; component inertia is finite and positive.
- Torque matches the negative numerical gradient of potential energy, including elevated centers of mass.
- Motion stays within contact bounds and agrees across 30/60/120 Hz frame rates. Resistance and damping dissipate energy.
- Invalid saved state and impossible component-mass settings are rejected.

## Browser checks

The Chromium walkthrough in `tests/browser.mjs` checks actual CAD-mesh dragging, larger draggable labels, both load limits, pivot limits, reverse-view drag direction, all four camera quadrants, background orbit, gear sliders, keyboard control/focus, saved-state reload, canceled drags, editable mass settings, 1024×600 and portrait layouts, touch dragging, WebGL/storage fallback, and local-only runtime requests.

The local run uses software-rendered WebGL on Linux. Screenshots are captured at 1366×768, 1024×600, and 390×844. This establishes behavior in the test environment, not performance on school hardware. GitHub Actions repeats model, build, and browser checks on the PR.

`docs/screenshots/` contains synthetic browser sessions. No student work or identities are used.

## Remaining verification

The physical lever has not been handled here. Mass defaults combine packet estimates and CAD inferences. Shaft resistance/damping and conservative table-contact limits are uncalibrated. Verify connector seating, gear stacks, alternate mounting positions, and actual outcomes using the checklist in [TEACHER-GUIDE.md](TEACHER-GUIDE.md).

Challenge mode, instructional mastery, full mechanical-advantage-unit coverage, sensor synchronization, and Learning Compass are outside this PR. No merge or deployment is performed while preparing it.
