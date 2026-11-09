# 02 — Gameplay

## The loop

1. A sky is generated from a seed. It contains one hidden constellation (rotated and scaled at random) and many decoy stars of varying sizes.
2. The player sees the **card**: the constellation's stars only, in canonical orientation, with proportionally correct distances and star sizes. No lines, no picture, no name.
3. The player taps stars to find the ones that match the card.
4. Each correct commit turns the star vivid yellow. When two stars joined by an authored edge are both found, a faint line appears between them.
5. When every member star is found, the game is over: the name is revealed and the moves-versus-par result is shown.

## Controls: two taps **[Decided]**

Tap a star to **select** it (free). Tap the same star again to **commit** the guess. Only commits count as moves.

| Situation | Player action | Result |
|-----------|---------------|--------|
| Nothing selected | Tap an idle star | Star becomes **selected** (ring shown). No move counted. |
| Star S selected | Tap S again | **Commit** S. Moves +1. Selection clears. |
| Star S selected | Tap a different idle star T | Selection **moves** to T. No move counted. |
| Star S selected | Tap empty sky | Selection **clears**. No move counted. |
| Any | Tap an already-committed star | **No-op.** Selection unchanged. No penalty. |
| Nothing selected | Tap empty sky | No-op. |
| Game over | Tap sky | Ignored; only the overlay button responds. |

Rationale: a fat-fingered tap on a phone costs nothing, and no extra buttons are needed.

## What a commit does

- If the star is a **member** of a target: it becomes **found** (vivid yellow). Every authored edge whose two endpoints are both found becomes visible as a faint line.
- If the star is a **decoy**: it becomes **ruled out** (slightly grayed).
- Either way, moves increases by 1.
- If every member star of every target is now found, the game ends.

An edge is only ever revealed when **both** endpoints are found. Two stars with no authored edge never get a line, even if they are neighbors.

## Scoring **[Decided]**

- **Score = number of commits** ("moves"). Lower is better.
- **Par = number of distinct member stars** across all targets. v1: the star count of the single target (4–7).
- Perfect game: moves = par.
- Re-tapping a committed star never costs anything; it is a no-op.
- Display: large number in the **top-left**, with a small "par N" beside it. The label text ("Moves") lives in the theme (07). **[Default]**

## Game over **[Decided]**

Game over occurs when all targets are found. v1 shows an overlay containing:

- the constellation's name,
- "Moves X · Par Y",
- the seed (small, for sharing and debugging),
- a **New sky** button (fresh random seed).

Faint lines for the full constellation remain visible behind the overlay.

## Feedback in v1 **[Decided]**

Color only (see 07). Sound is deferred. Because feedback is color-only, found and ruled-out stars differ from idle stars in *brightness and hue*, not hue alone.

## Hit testing **[Default]**

- Input is interpreted in **screen pixels**, even though the sky is authored in world units. Stars may be drawn small; they must stay tappable.
- A tap hits the **nearest star** whose center is within `max(input.hitRadiusPx, that star's drawn radius)` of the tap.
- Ties break by lower star id (determinism).
- Committed stars are still hit-tested, but a hit on one is a no-op (it cannot steal the selection).
- A tap is a pointer press and release that moves less than `input.tapMovePx`; larger movement is ignored (so page gestures do not trigger guesses).

## Edge cases and rulings

- **Selection and game state live in the core**, not the renderer: the renderer only draws what the state says.
- **Selecting never reveals anything.** The ring is the same for member and decoy; it must not leak which is which.
- **Decoy sizes** come from the same range as member sizes so size is a matching cue, not a giveaway (05).
- **Line visibility** is derived from found stars + authored edges; it is never stored separately.
- **Restart** always generates a new seed unless a `?seed=` URL parameter is present at load time (03, 06).
- **Resizing mid-game** does not regenerate the sky; see 04.
