# Next PR: Challenge

The current PR establishes the free exploration interface and shared mechanics. Challenge is deliberately absent from this release.

The next PR should add exactly two modes, **Learn** and **Challenge**, sharing the same model and direct manipulation. Learn is this unrestricted exploration workbench.

## Agreed Challenge behavior

- Show brief instructions before the timer starts.
- Set both load locations and the pivot for each round.
- Immobilize one of those three parts; give it a noticeable dark-purple glow.
- Give the two movable parts a noticeable bright-green glow. Use restrained intensity and include a non-color indication of locked/movable status.
- Permit the same legal moves and full camera orbit as Learn. No load or pivot can cross another part.
- Keep the active-round overlay minimal: timer and round. A solution means balancing the beam.
- Every puzzle must have a solution using the allowed moves. Some should require moving both available parts.
- Require varied, repeated demonstrations; a single success is not enough. Avoid presenting the same solution pattern repeatedly.

## Resolve before building Challenge

- Fix or explicitly permit changes to gear counts during a round. Unrestricted load sliders would otherwise change the intended puzzle space.
- Define the balance tolerance using the calibrated model, including static shaft resistance. Solve candidate puzzles against that same model instead of assuming a weightless beam.
- Decide round count, time allowance, retry behavior, and accommodations. Timing constrains trial-and-error; it does not itself prove understanding or prevent cheating.
- Enumerate solvable legal arrangements for each locked part and validate both single-part and two-part solutions. Draw tasks from that checked pool.
- Decide what progress, if any, should be stored. Learning Compass integration comes later; no student identities are collected in the current app.
