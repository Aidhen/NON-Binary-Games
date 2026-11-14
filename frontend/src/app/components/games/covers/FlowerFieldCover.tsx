// A corner of a field with a few numbers and a flag: enough to say "Flower Field" at the size of a box.
const CELLS = ['1', '', '', '1', '2', '1', '⚑', '', ''];

export function FlowerFieldCover() {
  return (
    <span className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-[var(--box-lid)]">
      <span className="grid grid-cols-3 gap-1">
        {CELLS.map((cell, i) => (
          <span
            key={i}
            className="flex size-6 items-center justify-center rounded-[5px] bg-[var(--paper)] text-sm font-extrabold leading-none text-[var(--title-text)]"
          >
            {cell}
          </span>
        ))}
      </span>
    </span>
  );
}
