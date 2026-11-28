# Memory cards: where the drawings go

Put the drawings of the Memory cards here, as SVG files. They are the source: once they are in, each one is turned into JSX in `../drawings.tsx`, which is what the game shows. Nothing in this folder is loaded by the site.

## What is expected

- **22 faces**, the major arcana of the tarot, one file each, named with their position and a short English name: `01-fool.svg`, `02-magician.svg` … `22-world.svg`. The number is the place of the drawing in the deck and does not change once the game is out: a room in play refers to its cards by that number. `cards.json` has the name and the description of each card in English and Italian, for the locale files.
- **1 back**, the same for every card: `back.svg`.
- **Tall, 3:4**: every file has the `viewBox` `0 0 300 400`, like a tarot card, so that every card takes the same room on the table. The dark face of the card and its border are drawn by `MemoryCardArt`, not in the files: a drawing sits on it edge to edge, with no background of its own.
- **Colors drawn in**: the colors are part of the drawing and do not change with the theme, as for the emotes. Same outline and flat shadow down and to the right as the other drawings of the site.
- **Different at a glance**: two faces must not be told apart only by their color (some players do not see the difference), nor only by a small detail. On a phone a card is about 55 px wide (73 px tall).

## What a file must not contain

The drawings are pasted into the page as inline SVG, so a file holds shapes only:

- no `<script>`, no `on…` attributes (`onload`, `onclick`), no `<foreignObject>`;
- no embedded or linked images (`<image>`, `href` / `xlink:href` to a file or a URL, `data:` URIs), no external fonts;
- no text: a word on a card would need a translation. Letters drawn as shapes are fine.

Files exported from an editor (Figma, Illustrator, Inkscape) carry metadata, ids and styles that are not needed: they are cleaned up when the drawing is converted, so there is no need to do it by hand.
