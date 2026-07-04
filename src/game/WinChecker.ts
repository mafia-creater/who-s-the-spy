import type { GameState, WinCheckResult } from '../types.js';
import { Role } from '../types.js';

// ─── Win Condition Checker ───────────────────────────────────────────────────

/**
 * Evaluate whether the game has reached a win condition.
 *
 * **Win rules:**
 * - **Civilians win** when every Spy *and* every Mr. White has
 *   been eliminated (alive bad guys === 0).
 * - **Undercover / Mr. White win** when the number of alive bad guys
 *   (Undercover + Mr. White) is greater than or equal to the number of alive
 *   Civilians.
 * - Otherwise the game continues.
 *
 * @param game - The current game state.
 * @returns A {@link WinCheckResult} indicating whether the game is over,
 *          who won, and a human-readable reason string.
 */
export function checkWin(game: GameState): WinCheckResult {
  let aliveCivilians = 0;
  let aliveSpies = 0;
  let aliveMrWhite = 0;

  for (const player of game.players.values()) {
    if (!player.isAlive) continue;

    switch (player.role) {
      case Role.Civilian:
        aliveCivilians++;
        break;
      case Role.Spy:
        aliveSpies++;
        break;
      case Role.MrWhite:
        aliveMrWhite++;
        break;
    }
  }

  const aliveBadGuys = aliveSpies + aliveMrWhite;

  // ── Civilians win ────────────────────────────────────────────────────────
  if (aliveBadGuys === 0) {
    return {
      gameOver: true,
      winner: 'civilians',
      reason:
        'All Spies and Mr. White have been eliminated! ' +
        'The Civilians win! 🎉',
    };
  }

  // ── Undercover / Mr. White win ───────────────────────────────────────────
  if (aliveBadGuys >= aliveCivilians) {
    // Determine the winning label based on who is still alive
    const hasUndercover = aliveSpies > 0;
    const hasMrWhite = aliveMrWhite > 0;

    let winnerLabel: string;
    if (hasUndercover && hasMrWhite) {
      winnerLabel = 'The Spies and Mr. White';
    } else if (hasMrWhite) {
      winnerLabel = 'Mr. White';
    } else {
      winnerLabel = 'The Spies';
    }

    return {
      gameOver: true,
      winner: 'spy',
      reason:
        `${winnerLabel} have overtaken the Civilians! ` +
        `With ${aliveBadGuys} infiltrator(s) against ${aliveCivilians} Civilian(s), ` +
        `the bad guys win! 😈`,
    };
  }

  // ── Game continues ───────────────────────────────────────────────────────
  return {
    gameOver: false,
    reason:
      `Game continues — ${aliveCivilians} Civilian(s) vs ` +
      `${aliveBadGuys} infiltrator(s) remaining.`,
  };
}
