// A corner of a grid with a word crossing it: enough to say "Word Search" at the size of a box.
const CELLS = ['S', 'O', 'L', 'K', 'E', 'A', 'M', 'R', 'T'];
const WORD = new Set([0, 1, 2]);

export function WordSearchCover() {
  return (
    <span className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-[var(--box-lid)]">
      <span className="grid grid-cols-3 gap-1">
        {CELLS.map((cell, i) => (
          <span
            key={i}
            className={`flex size-6 items-center justify-center rounded-[5px] text-sm font-extrabold leading-none ${WORD.has(i) ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'bg-[var(--paper)] text-[var(--title-text)]'}`}
          >
            {cell}
          </span>
        ))}
      </span>
    </span>
  );
}
