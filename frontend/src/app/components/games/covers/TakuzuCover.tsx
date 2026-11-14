// A corner of a grid with a few 0s and 1s in it: enough to say "Takuzu" at the size of a box.
const CELLS = ['0', '1', '', '1', '', '0', '', '0', '1'];

export function TakuzuCover() {
  return (
    <span className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-[var(--box-lid)]">
      <span className="grid grid-cols-3 gap-1">
        {CELLS.map((digit, i) => (
          <span
            key={i}
            className="flex size-6 items-center justify-center rounded-[5px] bg-[var(--paper)] text-sm font-extrabold leading-none text-[var(--title-text)]"
          >
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}
