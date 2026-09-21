# Lever Workshop · first classroom prototype

The goal is for a student to predict and explain how weight, distance from the pivot, and pivot location affect a lever. The app uses no Newton calculations.

## Suggested lesson

1) Build the real lever using the existing inventory and instruction packet.

2) Project the game. Identify the beam, pivot, left load, and right load. Explain that a **space** is a game interval, not an inch or a numbered hole.

3) Model one **predict → change → test → explain** round. Read every instruction aloud. The beam remains supported during editing; there is no continuous tilt to follow toward an answer.

4) Let partners work through **Weight**, **Distance**, **Pivot**, and **Combine**. The first round of each of the first three skills isolates an easier relationship. Later arrangements vary. Three independent successes are needed in each skill. Worked examples and corrected attempts count as practice and lead to fresh arrangements.

5) Use **Real-world lab** after Weight and Pivot. Start with the packet's A and B builds. Students enter a prediction, release the physical lever, then enter what they observed. The screen follows that observation. Ask them to explain a mismatch; do not require observations to agree with an idealized model.

6) In **Your build**, move the physical pivot or relocate a bracket to a permitted hole column, then reproduce that configuration on screen. Support both ends before detaching anything. A bracket's two pins use the two outer rows at the selected column. These alternate positions require a physical fit check before class.

7) Use the six-round challenge after guided practice. Accuracy determines the count; there are no speed points or public leaderboards. Choose 3 minutes, 5 minutes, or no timer in Teacher tools. The timer pauses when the tab is hidden or Teacher tools are open. Physical work has no timer.

8) Ask an individual student to predict a new arrangement and explain their decision aloud. A downloaded local result is supporting practice evidence, not proof of comprehension or an authenticated grade.

For a 45-minute bell, prioritize the build and the first two skills. The complete sequence is not promised to fit one class. The timer is optional; use it only after students understand the controls.

## What the two models mean

| View | Weights | Balance and movement |
| --- | --- | --- |
| Learn / Challenge | 1, 2, or 3 equal practice discs; colored discs are intentionally different from the real gear recipes | Ideal model: weight units × distance on each side. Beam and brackets have no modeled weight; weights act at the marked slots. A small tilt indicates direction only. |
| Real-world lab | Original VEX 60-tooth gear, optionally with a 36-tooth gear; recipes from the existing packet | The student's reported observation drives the view. No computed real-world outcome, sensor link, or automatic calibration is claimed. |

The real packet gives about **17 g** for the large-gear end assembly and **22 g** for the large-plus-small assembly, including the bracket and pins. They are not a 1:2 pair. We do not use these approximate numbers as equal game units.

The CAD offset connector has a lower shaft hole aligned with one mounting-pin column. With its current modeled orientation, a mounting pair at columns **10 and 11** puts the shaft axis at **column 11**, half a hole pitch from the beam's geometric midpoint. Do not assume that the mounting-pair midpoint is the shaft axis. The game's physical view aligns the shaft and connector holes; it does not claim that equal end loads must balance in that position. Verify the actual connector orientation and assembly on the classroom build.

Moving the real pivot also changes the beam's own turning effect. Bracket mass, load center positions, shaft friction, pin fit, and unequal parts can matter. Use these as observations to discuss. Exact real-world numerical balance is not scored in this prototype.

## Before classroom release

- [ ] Compare the complete 3D assembly with one actual built lever: beam orientation, bracket alignment, pin triangles, shaft clearance, gear seating, and collar gap.
- [ ] Check the offset-connector orientation and which numbered hole lies directly above the shaft.
- [ ] Physically test the packet's A and B arrangements. Record what happens; do not assume A must balance.
- [ ] Check every offered alternate pivot pair (6–7, 8–9, 10–11, 12–13, 14–15) and bracket column (left 1/3/5; right 16/18/20) for fit and clearance. The UI excludes close pairs, but CAD clearance is not a physical test.
- [ ] Open the deployed site on a school Chromebook and school network. Check 3D performance, touchpad, zoom, keyboard, and the fallback diagram. A local Chromium test is not school-device verification.
- [ ] Complete one lesson as a student and observe one student doing a fresh round. Check the language and workload.

## Teacher controls and local progress

The app needs no sign-in and collects no student names. Progress is stored in the browser profile, not sent to a server. On a shared Chromebook, select **Teacher tools → New student** before a new student begins. Browser storage can be cleared or changed; it is not a secure gradebook.

**Download evidence** creates a JSON file containing progress and this tab's completed rounds: starting arrangement, final arrangement, initial prediction, attempts, hint use, explanation retries, and independent status. Physical rounds contain the chosen recipes, hole locations, prediction, and observation. Reloading preserves counts but not the detailed round history. No Learning Compass integration is implemented yet.

The keyboard-accessible buttons are the primary controls. Dragging the 3D view rotates the camera; it does not move parts. Use **Side**, **3D**, or the reset button to restore a useful view. Set **Reduce lever animation** or use the device's reduced-motion setting. A 2D diagram is available automatically when 3D cannot load; the same learning sequence remains usable.

Comic Sans is the first font choice. Devices without it use bundled Comic Neue. There are no third-party runtime CDN calls.
