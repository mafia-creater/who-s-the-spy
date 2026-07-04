// ─── Enums ───────────────────────────────────────────────────────────────────

/** Phases of the game state machine. */
export enum GamePhase {
  Lobby = 'lobby',
  RoleAssignment = 'role_assignment',
  Clue = 'clue',
  Discussion = 'discussion',
  Vote = 'vote',
  Elimination = 'elimination',
  MrWhiteGuess = 'mr_white_guess',
  GameOver = 'game_over',
}

/** Player roles. */
export enum Role {
  Civilian = 'Civilian',
  Spy = 'Spy',
  MrWhite = 'Mr. White',
}

/** Which team won the game. */
export type WinnerTeam = 'civilians' | 'spy' | 'mrwhite';

// ─── Interfaces ──────────────────────────────────────────────────────────────

/** A single word pair used in a game round. */
export interface WordPair {
  civilian: string;
  spy: string;
}

/** Per-player state tracked during a game. */
export interface Player {
  userId: string;
  username: string;
  displayName: string;
  role?: Role;
  /** The word assigned to this player. `undefined` for Mr. White. */
  word?: string;
  isAlive: boolean;
  hasGivenClue: boolean;
  /** True if the bot couldn't DM this player. */
  dmFailed: boolean;
}

/** Configurable game settings (adjustable in lobby). */
export interface GameSettings {
  mrWhiteEnabled: boolean;
  /** Seconds each player has to submit a clue. */
  clueTimerSeconds: number;
  /** Seconds for the open discussion phase. */
  discussionTimerSeconds: number;
  /** Seconds for the voting phase. */
  voteTimerSeconds: number;
}

/** The full mutable state of one game instance. */
export interface GameState {
  guildId: string;
  channelId: string;
  hostId: string;
  phase: GamePhase;
  players: Map<string, Player>;
  settings: GameSettings;

  /** The word given to Civilians. */
  civilianWord: string;
  /** The related-but-different word given to Spies. */
  spyWord: string;

  /** Shuffled array of player user IDs defining turn order. */
  turnOrder: string[];
  /** Index into `turnOrder` for the current clue turn. */
  currentTurnIndex: number;
  /** Current round number (1-based). */
  round: number;

  /**
   * Clues submitted by each player, indexed by round.
   * Outer key: playerId, inner array index: round-1.
   */
  clues: Map<string, string[]>;

  /** Current voting-round votes: voterId → targetId. */
  votes: Map<string, string>;

  /** User IDs of players who have been eliminated (in order). */
  eliminatedPlayers: string[];

  /** Discord message ID of the lobby embed (for editing). */
  lobbyMessageId?: string;
  /** Discord message ID of the current phase embed (for editing). */
  phaseMessageId?: string;

  /** Set to true when the game has been force-ended. */
  forceEnded?: boolean;
}

/** Result of a win-condition check. */
export interface WinCheckResult {
  gameOver: boolean;
  winner?: WinnerTeam;
  reason: string;
}

/** Result of attempting to DM a user. */
export interface DMResult {
  success: boolean;
  userId: string;
}
