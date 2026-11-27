// A corner of a grid with a word crossing it: enough to say "Word Search" at the size of a box.
// Sunflower is a light lid, so its tiles and ink are fixed plum and cream in every theme: the theme inks would vanish on it.
const CELLS = ['S', 'O', 'L', 'K', 'E', 'A', 'M', 'R', 'T'];
const WORD = new Set([0, 1, 2]);

export function WordSearchCover() {
  return (
    <span className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-[var(--lid-word-search)] shadow-[inset_0_0_0_2.5px_#3A2E3F]">
      <span className="grid grid-cols-3 gap-1">
        {CELLS.map((cell, i) => (
          <span
            key={i}
            className={`flex size-6 items-center justify-center rounded-[5px] text-sm font-extrabold leading-none ${WORD.has(i) ? 'bg-[#3A2E3F] text-[#FFFDF7]' : 'bg-[#FFFDF7] text-[#3A2E3F]'}`}
          >
            {cell}
          </span>
        ))}
      </span>
    </span>
  );
}
