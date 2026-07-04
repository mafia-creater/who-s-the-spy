/**
 * Fisher-Yates (Knuth) in-place shuffle.
 *
 * Randomly reorders the elements of `array` using `Math.random()` and returns
 * the same array reference for convenient chaining.
 *
 * @typeParam T - Element type of the array.
 * @param array - The array to shuffle. It is mutated in place.
 * @returns The same `array` reference, now shuffled.
 *
 * @example
 * ```ts
 * const ids = ['a', 'b', 'c', 'd'];
 * shuffle(ids); // ids is now randomly reordered
 * ```
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at indices i and j
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
