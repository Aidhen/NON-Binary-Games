# Memory cards: where the drawings go

Put the drawings of the Memory cards here, as SVG files. They are the source: once they are in, each one is turned into JSX in `../drawings.tsx`, which is what the game shows. Nothing in this folder is loaded by the site.

## What is expected

- **22 faces**, one file each, named with their position and a short English name: `01-lemon.svg`, `02-moon.svg` … `22-teacup.svg`. The number is the place of the drawing in the deck and does not change once the game is out: a room in play refers to its cards by that number.
- **1 back**, the same for every card: `back.svg`.
- **Square**: every file has a square `viewBox` (for example `0 0 72 72`), so that every card takes the same room on the table. The drawing may leave a margin inside the square, but the margins should be about the same from one card to the next.
- **Colors drawn in**: the colors are part of the drawing and do not change with the theme, as for the emotes. Same outline and flat shadow down and to the right as the other drawings of the site.
- **Different at a glance**: two faces must not be told apart only by their color (some players do not see the difference), nor only by a small detail. On a phone a card is about 55 px wide.

## What a file must not contain

The drawings are pasted into the page as inline SVG, so a file holds shapes only:

- no `<script>`, no `on…` attributes (`onload`, `onclick`), no `<foreignObject>`;
- no embedded or linked images (`<image>`, `href` / `xlink:href` to a file or a URL, `data:` URIs), no external fonts;
- no text: a word on a card would need a translation. Letters drawn as shapes are fine.

Files exported from an editor (Figma, Illustrator, Inkscape) carry metadata, ids and styles that are not needed: they are cleaned up when the drawing is converted, so there is no need to do it by hand.
