// A number is complete when it is on the grid at least `size` times (givens included).
// Wrong placements count too: telling the correct ones apart would reveal which numbers
// are wrong, even with every error helper turned off.
export const getCompletedNumbers = (grid: number[][], size: number): Set<number> => {
  const counts = new Map<number, number>();

  for (const row of grid) {
    for (const value of row) {
      if (value !== 0) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  const completed = new Set<number>();
  counts.forEach((count, value) => {
    if (count >= size) completed.add(value);
  });
  return completed;
};
