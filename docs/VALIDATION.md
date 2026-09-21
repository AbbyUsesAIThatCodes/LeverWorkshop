# Validation · 2026-09-21

## Automated mechanics and assets

`npm test`: **16 passing tests**.

- Every one of the 678 generated challenges starts unbalanced and has a valid solution reachable with its allowed controls: weight 40, distance 60, pivot 124, combine 454.
- Verified unequal weights can balance at inverse distances; changing the pivot changes both arms.
- Invalid positions, weights, and crossing the pivot are rejected.
- Varied challenge selection avoids repeating an arrangement before its eligible pool is exhausted.
- A worked example, wrong initial prediction, repeated test, or corrected explanation cannot earn independent credit.
- Initial scaffold filters have multiple distinct solvable arrangements.
- Saved progress is versioned and bounded; corrupt storage falls back safely.
- All 11 CAD buffers decompress, contain finite positions/normals, and fit their declared bounds. Mixed source units are converted to hole-pitch coordinates.

## Browser walkthrough

The scripted Chromium walkthrough covers the complete guided progression and six-round challenge, assisted practice, progress persistence, timing, physical observations, export, reset, responsive layout, and fallback behavior. See `tests/browser.mjs` for the reproducible procedure. **Final local run: passed**, including keyboard focus retention during choices.

The local browser uses software-rendered WebGL on Linux. This establishes rendering and interaction behavior in that environment; it does not establish performance or availability on school Chromebooks.

Screenshots in `docs/screenshots/` show the prototype in the browser. They are synthetic test sessions, not student work.

## Remaining physical and instructional checks

The part meshes are original VEX CAD; their assembly transforms are newly authored. The teacher's actual build has not been handled or tested in this environment. In particular, verify the offset connector's shaft axis, gear seating, alternate bracket locations, and pivot clearance. See the detailed checklist in `TEACHER-GUIDE.md`.

No classroom mastery claim, full mechanical-advantage-unit coverage, calibrated prediction, sensor connection, or Learning Compass integration is made. Balance rounds introduce the weight–distance relationship; lifting and the force–travel tradeoff remain later instruction.

No deployment has been performed as part of preparing the PR.
