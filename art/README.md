# @nbg/art

The drawings of (non)BinaryGames, as React components: the logo, the emotes and the cards of the Memory.

- `LogoMark`: the two tiles of the logo. Its colors come from the `--logo-*` CSS variables, so every theme of the site gives it its own; without them it uses the colors it was drawn with.
- `EmoteArt`: the drawing of one emote, chosen by its Unicode emoji. The emoji is still what the game sends and receives; an emoji with no drawing yet is shown as it is.
- `EMOTE_DRAWINGS`: every drawing, for a page that wants to show them all.
- `MemoryCardArt`: one side of a Memory card, chosen by the place of its face in the deck (or `back`). A face with no drawing yet is a numbered tile. The SVG sources, and what they must and must not contain, are in `src/memory/svg/`.

Everything is inline SVG: nothing is downloaded, and the only dependency is React.

## Using the drawings

The drawings are covered by the license of the repository (see [LICENSE](../LICENSE)): they can be used, changed and shared for noncommercial purposes, keeping the copyright notice. The logo is the exception: together with the name (non)BinaryGames it identifies this project, so please do not use it for another one.

The emotes were drawn for this project together with an artist.
