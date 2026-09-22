# Lever Workshop · exploration release

Students explore how mass, distance, and pivot position affect a lever. This interface has no locked steps, quiz, timer, or scoring. No Newton conversions are required.

## A simple classroom sequence

1. Build the real lever using the inventory and instruction packet.

2. Open the workbench. Identify **load A**, **load B**, and the **pivot**. Letters stay with their physical loads as the camera turns.

3. Predict what moving one load toward the pivot will do.

4. Drag that load by the part or its floating label. It snaps to a hole column. Let go and watch.

5. Make the same change on the real lever. Support both ends before detaching physical parts. Compare what happens and discuss differences.

6. Repeat with a change to the gear count, then to the pivot. Ask students to describe what changed on both sides when the pivot moved.

7. Try balancing a new arrangement, then ask a student to explain why it balances. The app does not claim or record mastery.

**Hold level** keeps the beam supported while students arrange parts. **Release** lets it move. Every change begins from level, including direct dragging. This is a deliberate editing support, not a simulation of taking pieces apart while the lever is moving.

## Controls

| Control                                   | Behavior                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Drag a load, pivot, or its floating label | Snap to available mounting columns. Loads cannot cross the pivot.                                                     |
| Two side gear sliders                     | Add/remove alternating large and small gears, each with three pins. Hover or focus highlights the corresponding load. |
| Bottom part selector and position slider  | Keyboard alternative for all three movable parts. Arrow keys move one column; Home/End reach the allowed limits.      |
| Drag the table                            | Orbit all the way around the model.                                                                                   |
| Scroll / pinch                            | Zoom.                                                                                                                 |
| Side view / Orbit / Fit view              | Side-on view, quarter-turn, and camera reset.                                                                         |
| Hold level / Release                      | Support or release the beam.                                                                                          |
| Reset                                     | Restore load locations, gear counts, and central pivot. Keeps model calibration.                                      |
| Model                                     | Show assumptions, enter measured masses, or reduce animation.                                                         |

When looking straight along the beam, its mounting positions overlap on screen. Turn the camera slightly or use the position slider. Escape, pointer cancellation, or leaving the window during a part drag restores the starting arrangement.

The workbench fills the window. The top full-screen button can also hide browser chrome where supported. On narrow portrait screens, the gear sliders move above the scene. Comic Sans is preferred; bundled Comic Neue is used when it is unavailable.

## Parts and balance

The beam has 20 numbered mounting columns. A load bracket uses the outer two holes at one column. The pivot uses a neighboring pair: **10 + 11** is the central position. Load A must be before both pivot columns, and load B must be after them.

**Correction to the first release:** our earlier guide incorrectly put the offset connector's lower shaft hole directly beneath column 11. Inspection of the original CAD places it halfway between its two mounting pins. With the pins in **10 and 11**, the shaft lies at the beam midpoint. The new shared assembly transforms put both connector holes on that shaft axis. The earlier half-pitch error was in the software, not in the teacher's instructions.

| Slider setting | Added gears       | Added pins | Approximate complete load |
| -------------- | ----------------- | ---------- | ------------------------- |
| 0              | None              | 0          | 6 g                       |
| 1              | 1 large           | 3          | 17 g                      |
| 2              | 1 large + 1 small | 6          | 22 g                      |
| 3              | 2 large + 1 small | 9          | 33 g                      |
| 4              | 2 large + 2 small | 12         | 38 g                      |

The bracket's five permanent pins remain in every setting. Packet masses give approximately 6 g for that bracket assembly, 11 g for a large gear with three pins, and 5 g for a small gear with three pins. These are not equal game-weight units.

The beam and pivot connectors also contribute to balance. The model uses their CAD shapes and estimated masses, accounts for actual off-center gear stacks, and updates rotational inertia as parts move. Because the loads sit above the shaft, level balance can be unstable: a disturbed lever may continue tipping. The display reports whether the arrangement balances **from level**.

The simulation stops at a conservative estimate of table contact. Shaft friction and motion damping are adjustable approximations. Settings include their units for teacher calibration; students do not need to calculate them. There is no live sensor synchronization. See [MECHANICS.md](MECHANICS.md) for equations and assumptions.

## Check against the classroom build

- Compare shaft threading, both offset connectors, gear seating, pin patterns, collar clearance, and bracket orientation with an assembled lever.
- Weigh the beam, a bare pin, an offset connector, the complete bracket, and both gear-plus-three-pin packs if a gram scale is available. Enter these in **Model → Adjust measured masses and motion**.
- Check fit at alternate bracket and pivot locations, especially the closest permitted positions and the three/four-gear stacks. CAD alignment is not a physical fit test.
- Compare central equal loads, unequal end loads, and an off-center pivot. Record any difference rather than requiring the real build to match uncalibrated defaults.
- Open on a school Chromebook and school network; check the touchpad, 3D performance, and keyboard alternatives. Local Chromium checks do not establish school-device performance.

Saved arrangements and settings belong to the browser profile, not an identified student. **Reset** restores the arrangement; **Restore estimates** resets calibration. No student names, grades, progress exports, or Learning Compass integration are part of this release.
