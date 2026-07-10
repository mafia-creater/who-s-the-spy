import type { GameState, Player } from '../types.js';
import { Role } from '../types.js';
import { getRandomWordPair } from '../data/wordPairs.js';
import { shuffle } from '../utils/shuffle.js';

// ─── Role Distribution ──────────────────────────────────────────────────────

/** Shape returned by {@link getRoleDistribution}. */
export interface RoleDistribution {
  civilians: number;
  spy: number;
  mrWhite: number;
}

/**
 * Base distribution table for player counts 4–12.
 *
 * ```
 * Players | Civilians | Undercover | Mr. White
 *   4     |     3     |     1      |    0
 *   5     |     3     |     1      |    1
 *   6     |     4     |     1      |    1
 *   7     |     5     |     1      |    1
 *   8     |     5     |     2      |    1
 *   9     |     6     |     2      |    1
 *  12     |     8     |     3      |    1
 * ```
 */
const DISTRIBUTION_TABLE: Record<number, RoleDistribution> = {
  4:  { civilians: 3,  spy: 1, mrWhite: 0 },
  5:  { civilians: 3,  spy: 1, mrWhite: 1 },
  6:  { civilians: 4,  spy: 1, mrWhite: 1 },
  7:  { civilians: 5,  spy: 1, mrWhite: 1 },
  8:  { civilians: 5,  spy: 2, mrWhite: 1 },
  9:  { civilians: 6,  spy: 2, mrWhite: 1 },
  10: { civilians: 7,  spy: 2, mrWhite: 1 },
  11: { civilians: 8,  spy: 2, mrWhite: 1 },
  12: { civilians: 8,  spy: 3, mrWhite: 1 },
};

/**
 * Determine the role distribution for a given player count.
 *
 * When Mr. White is disabled the Mr. White slot is redistributed:
 * - For 4 players, Mr. White is already 0 so nothing changes.
 * - For 5+ players, the 1 Mr. White slot is added to civilians.
 *
 * @param playerCount    - Total number of players (4–12).
 * @param mrWhiteEnabled - Whether the Mr. White role is active.
 * @returns The number of each role to assign.
 * @throws Error if `playerCount` is outside the 4–12 range.
 */
export function getRoleDistribution(
  playerCount: number,
  mrWhiteEnabled: boolean,
): RoleDistribution {
  const base = DISTRIBUTION_TABLE[playerCount];
  if (!base) {
    throw new Error(
      `Unsupported player count: ${playerCount}. Must be between 4 and 12.`,
    );
  }

  // If Mr. White is disabled, shift their slot to civilians
  if (!mrWhiteEnabled) {
    return {
      civilians: base.civilians + base.mrWhite,
      spy: base.spy,
      mrWhite: 0,
    };
  }

  return { ...base };
}

/**
 * Assign roles and words to every player in the game.
 *
 * This function **mutates** the supplied {@link GameState}:
 * - Sets `civilianWord` and `spyWord` from a random word pair.
 * - Sets each player's `role` and `word`.
 * - Sets `turnOrder` to a fresh shuffle of alive player IDs.
 *
 * @param game - The game state to mutate. Must already have players added.
 * @throws Error if no players are present.
 */
export function assignRoles(game: GameState): void {
  const playerIds = [...game.players.keys()];
  if (playerIds.length === 0) {
    throw new Error('Cannot assign roles: no players in the game.');
  }

  // 1. Pick a random word pair
  const wordPair = getRandomWordPair();
  game.civilianWord = wordPair.civilian;
  game.spyWord = wordPair.spy;

  // 2. Determine distribution
  const dist = getRoleDistribution(playerIds.length, game.settings.mrWhiteEnabled);

  // 3. Shuffle player IDs so role assignment is random
  const shuffledIds = shuffle([...playerIds]);

  // 4. Assign roles in order: undercover first, then Mr. White, then civilians
  let idx = 0;

  for (let i = 0; i < dist.spy; i++, idx++) {
    const player = game.players.get(shuffledIds[idx])!;
    player.role = Role.Spy;
    player.word = game.spyWord;
  }

  for (let i = 0; i < dist.mrWhite; i++, idx++) {
    const player = game.players.get(shuffledIds[idx])!;
    player.role = Role.MrWhite;
    player.word = undefined; // Mr. White doesn't know the word
  }

  for (let i = 0; i < dist.civilians; i++, idx++) {
    const player = game.players.get(shuffledIds[idx])!;
    player.role = Role.Civilian;
    player.word = game.civilianWord;
  }

  // 5. Set turn order to a separate shuffle of all alive player IDs
  game.turnOrder = shuffle([...playerIds]);
}
