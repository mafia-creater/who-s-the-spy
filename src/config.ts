import type { GameSettings } from './types.js';

// ─── Environment ─────────────────────────────────────────────────────────────

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN ?? '';
export const CLIENT_ID = process.env.CLIENT_ID ?? '';
export const GUILD_ID = process.env.GUILD_ID ?? '';

// ─── Game Constraints ────────────────────────────────────────────────────────

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;

// ─── Default Game Settings ───────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Readonly<GameSettings> = {
  mrWhiteEnabled: true,
  clueTimerSeconds: 60,
  discussionTimerSeconds: 60,
  voteTimerSeconds: 45,
};

// ─── Embed Colour Palette ────────────────────────────────────────────────────

export const Colors = {
  /** Lobby / setup — purple */
  Lobby: 0x9b59b6,
  /** Clue phase — blue */
  Clue: 0x3498db,
  /** Discussion — amber/yellow */
  Discussion: 0xf1c40f,
  /** Voting / elimination — red */
  Vote: 0xe74c3c,
  /** Game over / win — emerald green */
  GameOver: 0x2ecc71,
  /** Informational / status — teal */
  Info: 0x1abc9c,
  /** Error / warning — dark red */
  Error: 0xc0392b,
  /** Mr. White — white/silver */
  MrWhite: 0xecf0f1,
  /** Role DM — dark purple */
  RoleDM: 0x8e44ad,
} as const;

// ─── Custom-ID Prefixes ──────────────────────────────────────────────────────
// All interactive component custom IDs follow the pattern:
//   wts:<action>:<guildId>[:<extra>]

export const ID = {
  /** Build a custom ID string. */
  make: (action: string, guildId: string, extra?: string): string =>
    extra ? `wts:${action}:${guildId}:${extra}` : `wts:${action}:${guildId}`,

  /** Parse a custom ID string. Returns null if format doesn't match. */
  parse: (
    customId: string,
  ): { action: string; guildId: string; extra?: string } | null => {
    const parts = customId.split(':');
    if (parts.length < 3 || parts[0] !== 'wts') return null;
    return {
      action: parts[1],
      guildId: parts[2],
      extra: parts.length > 3 ? parts.slice(3).join(':') : undefined,
    };
  },
} as const;

// ─── Action Names (for custom IDs) ──────────────────────────────────────────

export const Actions = {
  Join: 'join',
  Leave: 'leave',
  Start: 'start',
  ToggleMrWhite: 'toggle_mrwhite',
  GiveClue: 'give_clue',
  ClueModal: 'clue_modal',
  Vote: 'vote',
  MrWhiteGuess: 'mrwhite_guess',
  MrWhiteGuessModal: 'mrwhite_guess_modal',
} as const;
