/**
 * A timer that can be cancelled before it naturally expires.
 *
 * - `promise` resolves to `true` when the timer completes naturally.
 * - `promise` resolves to `false` when {@link cancel} is called early.
 * - Calling `cancel()` after the timer already resolved is a safe no-op.
 */
export interface CancellableTimer {
  /** Resolves `true` if the timer completed naturally, `false` if cancelled. */
  promise: Promise<boolean>;
  /** Cancel the timer early. Safe to call multiple times. */
  cancel: () => void;
}

/**
 * Create a cancellable timer that resolves after `seconds` seconds.
 *
 * @param seconds - Duration in seconds (must be > 0).
 * @returns A {@link CancellableTimer} whose promise settles when the timer
 *          either expires naturally (`true`) or is cancelled (`false`).
 *
 * @example
 * ```ts
 * const timer = createTimer(60);
 *
 * // Cancel early if all players submit clues
 * if (allCluesIn) timer.cancel();
 *
 * const completed = await timer.promise;
 * // completed === false → cancelled early
 * // completed === true  → full 60 s elapsed
 * ```
 */
export function createTimer(seconds: number): CancellableTimer {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let resolve: ((completed: boolean) => void) | undefined;

  const promise = new Promise<boolean>((res) => {
    resolve = res;
    timeoutId = setTimeout(() => {
      resolve = undefined;
      timeoutId = undefined;
      res(true);
    }, seconds * 1_000);
  });

  const cancel = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (resolve) {
      resolve(false);
      resolve = undefined;
    }
  };

  return { promise, cancel };
}

/**
 * Simple promise-based delay.
 *
 * @param ms - Milliseconds to wait.
 * @returns A promise that resolves after `ms` milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
