# Millimeter Lab — companion to Lever Workshop

This separate experiment opens at `metric/` in the built site. The original gear-and-hole workshop keeps its model, controls, storage and URL. Both are bundled by the existing build. A separate repository fork was unnecessary for this first reviewable companion.

## Classroom use

- Two named masses (A/B), 25–1,000 g in 25 g steps. Their size changes with mass.
- Each carriage slides 50–300 mm from a fixed central fulcrum, in 25 mm steps.
- Drag the object or label; select to retain green arrows. Horizontal arrows move across the screen, including from behind. Drag the vertical handle to resize, or use plus/minus, sliders, number boxes and keyboard alternatives.
- Begin with equal arms. Double A's distance, predict, then halve its mass. It balances again. The 2× and 3× presets give other balanced starting arrangements, without lesson gates or scores.
- Hide math for predictions. Reveal **Balance & advantage** for live distance ratio, mass-distance products, and required effort mass. **Grams → newtons** shows every conversion and the resulting SI turning effects.
- Choose which side represents effort. A and B remain attached to the same physical parts.
- Focus, hover or tap dotted math terms for concise explanations. Fraction bars explain division; units and operators have definitions.

## Deliberate idealization

The original workshop remains the approximate real-kit model. This companion counts only its two labeled masses. Its beam and hangers are massless and its centered axle has zero static friction. The full model uses gravity 9.81 N/kg and torque `(massA_g * distanceA_mm - massB_g * distanceB_mm) * 9.81 / 1e6 * cos(angle)` in N·m. Exact integer products determine balance, avoiding floating-point drift at balance.

Distance labels measure along the rail from the axle to the hanger. At tilt, both perpendicular moment arms are multiplied by cos(angle), so equilibrium and IMA are unchanged. Displayed turning effects are evaluated at level. IMA = effort arm / load arm; the load/effort force ratio only equals IMA when balanced. Required masses outside the range or 25 g steps are identified explicitly. Decimal results are rounded for display, not for calculation.

The original Three.js room, materials setup, lighting and orbit controls are reused. The companion has a custom slotted rail, sliding clamps, bored bearings, axle, hanging masses and restrained brass fittings. It is not a VEX CAD replica or a verified classroom kit. Hangers counter-rotate to stay vertical. Motion has visual damping and a ±12° display travel limit; it is not a prediction of real settling time.

Saved state has its own browser-storage key. All runtime assets are local; no student data or external service is used. Without WebGL, the same calculations and side controls work with a diagram. The diagram does not support object dragging or camera controls.

## Verification (2026-09-24)

- `npm test`: 17 tests passed, including all 193,600 legal metric mass/distance combinations, SI units, role reversal, exact balance, animation limits and invalid input.
- Geometry checks: axle ray passes through the beam's real bore; hangers stay vertical; minimum/maximum masses and positions clear the center support and desk at either travel stop.
- `npm run build`: passed; existing workshop and companion both built.
- Interactive cloud browser: fallback UI verified at 1366×768 and 390×844; checked 2:1 balancing, 3:1 conversions, role changes, held/released status, math hide/show, input limits and responsive layout.
- This browser disables WebGL. Consequently 3D visual quality, object dragging and orbit interactions have not been observed here. The repository browser CI now includes these checks and captures `metric-workshop.png`, `metric-newtons.png`, and `metric-mobile.png` when run in its software-WebGL environment. CI results must be checked separately.
- No physical classroom validation or student trial has been performed.

Per the repository working agreement, this is a review PR. It has not been merged or deployed.
