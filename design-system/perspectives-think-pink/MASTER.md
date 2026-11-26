# Website prototype styles (not the Perspectives brand)

> These colours, fonts and effects are placeholders for this website
> prototype only. The magazine's visual identity has not been decided and
> will be designed by the members; replace these tokens when it is.
> Supersedes the auto-generated palette (purple/rose on navy, Russo One)
> produced at kickoff.

## Idea

One device across the site: letters extruded toward a vanishing point.
The home wordmark does it live (the vanishing point follows the pointer);
headings elsewhere carry a fixed, shallow extrusion; the basketball court
floor recedes toward the same kind of horizon.

## Themes

| Theme | Used on | Background | Text | Accent |
|---|---|---|---|---|
| red | Home | `#A8261B` | `#F2EAD5` paper | `#3A0B08` (hard shadow) |
| paper | What's on | `#F2EAD5` | `#1D1914` ink | `#A8261B` red, `#FF5CA5` for Think Pink |
| arena | Basketball, officials, editors | `#12080F` + radial `#4A1638` spotlight | `#F7EEF3` | `#FF5CA5` pink, `#E7B65C` gold (final, champion) |

Errors on dark: `#FF8F7A`. Full team: `#5FD39A`.

## Type

* Display and UI labels: **Big Shoulders** (variable, `opsz` 10–72, auto optical sizing), 700–900.
* Body: **Spectral** 400/600, italic for leads and notes.
* Sentence case everywhere except the wordmark and the Think Pink title.

## Components

* Buttons: square-ish (3px radius), Big Shoulders 800. Pink fill on arena, red with hard ink shadow on paper, paper slab with hard shadow on red.
* Team cell: dark slab, 4px pink edge on the bracket side, five "pips" = five players.
* Winner slot: dashed outline, "Winner of" + code. Final slots gold.
* Dialogs: paper dialog with hard red offset shadow; arena dialog with pink glow.

## Motion

* One orchestrated moment per page: home letters extrude on load; bracket wires draw in round by round, then the Schedule button pings twice.
* Ambient only where the brief asked for it (arena spotlights, players floating).
* `prefers-reduced-motion`: everything static; home vanishing point moves only on click.
