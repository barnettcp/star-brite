# 07 — Visual spec

Visuals are deliberately minimal in v1 and entirely driven by a theme object, so the longer-term "light, colorful, playful" direction is a data change.

## Layout **[Default]**

```
┌────────────────────────────────────────────┐
│ 12 Moves            par 5        ┌────────┐ │
│                                  │  card  │ │
│                                  └────────┘ │
│                                             │
│                 the sky                     │
│                                             │
└────────────────────────────────────────────┘
```

- The canvas fills the viewport. The sky is the whole canvas.
- **Score: top-left**, large font, with a small "par N" beside it **[Decided]**. Sized roughly `clamp(40px, 9vmin, 72px)`.
- **Card: top-right**, a square of `layout.cardFraction × min(viewport)` clamped to `layout.cardMinPx..layout.cardMaxPx`, inset by `layout.hudInsetPx` and the device safe-area insets.
- HUD regions are reserved in generation (05) so no star is hidden underneath them.
- Background is a flat navy fill in v1.

## Colors **[Default]** (all in the theme; adjust freely)

| Role | Value | Notes |
|------|-------|-------|
| `background` | `#0a1233` | Navy sky fill. (Theme keys are deliberately not namespaced like config keys such as `sky.widthUnits`.) |
| `star.idle` | `#fff6d6` | Warm white-yellow. All stars start here. |
| `star.found` | `#ffd60a` | Vivid yellow. Committed member. |
| `star.ruledOut` | `#a7a69c` | Slightly grayed. Committed decoy. |
| `star.selectedRing` | `#ffffff` | 2 px ring at drawn radius + 4 px. Same for members and decoys; must not leak truth. |
| `line.color` / `line.opacity` | `#ffd60a` / 0.35 | Faint. Width about 1.5 px. |
| `hud.text` | `#f4f1e6` | Score text. |
| `card.background` | `#ffffff` at 6% | A subtle translucent panel behind the card stars. |
| `card.border` | `#ffffff` at 18% | Thin outline. |
| `overlay.scrim` | `#000000` at 55% | Behind the game-over panel. |

Star states form a small state set: **idle**, **found**, **ruled out**, plus the transient **selected** ring. Found vs. idle should differ in saturation and brightness, not just hue (color-vision differences); lines appearing is an additional cue for members.

## Stars

- Drawn as filled circles. Radius in world units = `size × stars.radiusPerSizeUnits`, converted to pixels and floored at `stars.minDrawnRadiusPx`.
- v1 has no glow, twinkle or texture. Those are polish (09).
- Draw order: members then decoys (creation order). Lines are drawn beneath stars.

## Lines

- Drawn only between two found stars joined by an authored edge.
- Faint by design; they confirm a discovery without drowning the sky.

## Reference card

- Draws the target's normalized stars in **canonical orientation**, fit into the card box with about 12% padding, **proportionally correct distances**.
- Star radius uses the same `size → radius` mapping, expressed relative to the constellation's extent at multiplier 1.0, so the card shows true relative sizes. Floored at `stars.minDrawnRadiusPx`.
- **Stars only.** No lines, no name, no picture until found. A small caption ("Find this pattern") is allowed via a theme string.
- The card draws a constellation into a box and nothing else, so a future "hand of cards" reuses it.

## Game-over overlay

A centered panel over a scrim: the constellation name, "Moves X · Par Y", the seed in small text, and a **New sky** button. The completed constellation's lines remain visible behind it.

## Typography **[Default]**

System font stack in v1 (no font downloads). Theme-controlled strings: score label ("Moves"), par format, card caption, overlay texts.

## Theme object

One object owns: all colors above, line width/opacity, ring size, font family and sizes, label strings. Changing the look = swapping the object. A "playful" theme later should not touch any logic.

## Responsive and rendering notes

- Handle device pixel ratio and window resize (04 for what resizing does to the world).
- Anti-aliased circles at fractional device pixels are fine; no pixel snapping.
- Test on a phone-width portrait (about 390×844), a 600×800 window, and a wide desktop (1280×800).
