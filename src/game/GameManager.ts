import type { GameState, GameSettings } from '../types.js';
import { GamePhase } from '../types.js';
import { DEFAULT_SETTINGS } from '../config.js';

// ─── GameManager ─────────────────────────────────────────────────────────────

/**
 * Singleton class that manages all active Who's the Spy games.
 *
 * Games are stored in memory, keyed by Discord guild (server) ID.
 * Each guild can have at most one active game at a time.
 */
class GameManager {
  /** Active games, keyed by guild ID. */
  private games: Map<string, GameState> = new Map();

  /**
   * Create a new game for a guild.
   *
   * Initialises the full {@link GameState} with empty collections,
   * default settings, and the Lobby phase.
   *
   * @param guildId   - The Discord guild ID.
   * @param channelId - The channel where the game was started.
   * @param hostId    - The user ID of the game host.
   * @returns The newly created GameState.
   * @throws Error if a game already exists for this guild.
   */
  createGame(guildId: string, channelId: string, hostId: string): GameState {
    if (this.games.has(guildId)) {
      throw new Error(`A game already exists in guild ${guildId}. End it before starting a new one.`);
    }

    const game: GameState = {
      guildId,
      channelId,
      hostId,
      phase: GamePhase.Lobby,
      players: new Map(),
      settings: { ...DEFAULT_SETTINGS },

      // Words are assigned later during role assignment
      civilianWord: '',
      spyWord: '',

      // Turn tracking
      turnOrder: [],
      currentTurnIndex: 0,
      round: 1,

      // Per-round data
      clues: new Map(),
      votes: new Map(),

      // Elimination history
      eliminatedPlayers: [],
    };

    this.games.set(guildId, game);
    return game;
  }

  /**
   * Get the active game for a guild.
   *
   * @param guildId - The Discord guild ID.
   * @returns The GameState, or `undefined` if no game is active.
   */
  getGame(guildId: string): GameState | undefined {
    return this.games.get(guildId);
  }

  /**
   * Check whether a guild currently has an active game.
   *
   * @param guildId - The Discord guild ID.
   * @returns `true` if a game exists for this guild.
   */
  hasGame(guildId: string): boolean {
    return this.games.has(guildId);
  }

  /**
   * Remove / end a game for a guild, freeing all associated state.
   *
   * This is a no-op if no game exists for the guild.
   *
   * @param guildId - The Discord guild ID.
   */
  endGame(guildId: string): void {
    this.games.delete(guildId);
  }
}

/** The single shared GameManager instance for the entire bot process. */
export const gameManager = new GameManager();
