import { EmbedBuilder } from 'discord.js';
import { Colors, MIN_PLAYERS, MAX_PLAYERS } from '../config.js';
import { type GameState, type GameSettings, type Player, type WinnerTeam, Role, GamePhase } from '../types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Standard footer with round info. */
function roundFooter(round: number): string {
  return `Who's the Spy • Round ${round}`;
}

/** Role → emoji mapping for the game-over summary. */
function roleEmoji(role: Role): string {
  switch (role) {
    case Role.Civilian:   return '✅';
    case Role.Spy: return '🕵️';
    case Role.MrWhite:    return '👻';
  }
  return '❓';
}

/** Alive/eliminated status indicator. */
function statusIndicator(alive: boolean): string {
  return alive ? '💚' : '💀';
}

/** Friendly phase name for the status embed. */
function phaseName(phase: GamePhase): string {
  const map: Record<GamePhase, string> = {
    [GamePhase.Lobby]:          'Lobby',
    [GamePhase.RoleAssignment]: 'Assigning Roles',
    [GamePhase.Clue]:           'Clue Phase',
    [GamePhase.Discussion]:     'Discussion Phase',
    [GamePhase.Vote]:           'Voting Phase',
    [GamePhase.Elimination]:    'Elimination',
    [GamePhase.MrWhiteGuess]:   'Mr. White Guess',
    [GamePhase.GameOver]:       'Game Over',
  };
  return map[phase];
}

/** Format seconds as `M:SS`. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Lobby ───────────────────────────────────────────────────────────────────

/**
 * Lobby embed showing joined players, current settings, and the host.
 * Updated every time a player joins or leaves.
 */
export function lobbyEmbed(
  players: Map<string, Player>,
  settings: GameSettings,
  hostName: string,
): EmbedBuilder {
  const playerList = players.size > 0
    ? Array.from(players.values()).map((p, i) => `${i + 1}. ${p.displayName}`).join('\n')
    : '*No players yet — click **Join** below!*';

  const settingsLines = [
    `⏱️ Clue Timer: **${settings.clueTimerSeconds}s**`,
    `💬 Discussion Timer: **${settings.discussionTimerSeconds}s**`,
    `🗳️ Vote Timer: **${settings.voteTimerSeconds}s**`,
    `👻 Mr. White: **${settings.mrWhiteEnabled ? 'Enabled' : 'Disabled'}**`,
  ].join('\n');

  return new EmbedBuilder()
    .setColor(Colors.Lobby)
    .setTitle("🎭 Who's the Spy — Lobby")
    .setDescription(
      `Hosted by **${hostName}**\n\n` +
      `Need **${MIN_PLAYERS}–${MAX_PLAYERS}** players to start.`,
    )
    .addFields(
      { name: `👥 Players (${players.size})`, value: playerList, inline: false },
      { name: '⚙️ Settings', value: settingsLines, inline: false },
    )
    .setFooter({ text: "Who's the Spy • Lobby" })
    .setTimestamp();
}

// ─── Role Assignment DM ─────────────────────────────────────────────────────

/**
 * DM embed revealing a player's role and word.
 * Mr. White sees no word; Undercover gets a suspicious prompt.
 */
export function roleAssignedEmbed(role: Role, word?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(Colors.RoleDM).setTimestamp();

  switch (role) {
    case Role.Civilian:
    case Role.Spy:
      embed
        .setTitle('🎭 Your Role: Civilian OR Spy')
        .setDescription(
          'You are either a **Civilian** or the **Spy**.\n' +
          'Blend in, give subtle clues, and figure out who is who!\n\n' +
          `🔑 **Your word:** \`${word}\`\n\n` +
          '> If you are the Civilian, find the impostors.\n' +
          '> If you are the Spy, blend in and survive!',
        );
      break;

    case Role.MrWhite:
      embed
        .setTitle('👻 Your Role: Mr. White')
        .setDescription(
          'You are **Mr. White** — you have **no word**.\n' +
          'You must bluff your way through every round!\n\n' +
          '🔑 **Your word:** `???`\n\n' +
          '> Listen carefully to clues and try to figure out the civilian word.\n' +
          '> If you\'re eliminated, you get one last chance to guess it!',
        );
      break;
  }

  embed.setFooter({ text: "Who's the Spy • Keep this secret!" });
  return embed;
}

// ─── Clue Phase ──────────────────────────────────────────────────────────────

/**
 * Main clue-phase embed showing the turn order, who has given clues,
 * and whose turn it currently is.
 */
export function cluePhaseEmbed(
  turnOrder: string[],
  currentPlayerName: string,
  currentTurnIndex: number,
  cluesThisRound: { name: string; clue: string }[],
  round: number,
): EmbedBuilder {
  // Build the turn order list with indicators
  const orderLines = turnOrder.map((_, i) => {
    const submitted = cluesThisRound[i];
    if (i < currentTurnIndex) {
      // Already submitted
      return `~~${i + 1}. ${submitted?.name ?? 'Unknown'}~~ — *"${submitted?.clue ?? '…'}"*`;
    } else if (i === currentTurnIndex) {
      return `**▶ ${i + 1}. ${currentPlayerName}** *(current turn)*`;
    } else {
      return `${i + 1}. *waiting…*`;
    }
  }).join('\n');

  return new EmbedBuilder()
    .setColor(Colors.Clue)
    .setTitle('🔍 Clue Phase')
    .setDescription(
      `It's **${currentPlayerName}**'s turn to give a clue!\n\n` +
      `${orderLines}`,
    )
    .setFooter({ text: roundFooter(round) })
    .setTimestamp();
}

/**
 * Waiting-for-clue embed shown while the clock ticks for one player.
 */
export function waitingForClueEmbed(
  playerName: string,
  secondsLeft: number,
  round: number,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Clue)
    .setTitle('🔍 Waiting for Clue…')
    .setDescription(
      `**${playerName}** is thinking…\n\n` +
      `⏳ Time remaining: **${formatTime(secondsLeft)}**`,
    )
    .setFooter({ text: roundFooter(round) })
    .setTimestamp();
}

// ─── Discussion Phase ────────────────────────────────────────────────────────

/**
 * Discussion-phase embed with a countdown timer.
 */
export function discussionEmbed(secondsLeft: number, round: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Discussion)
    .setTitle('💬 Discussion Phase')
    .setDescription(
      'All clues are in! Talk it out — who seems suspicious?\n\n' +
      `⏳ Time remaining: **${formatTime(secondsLeft)}**\n\n` +
      '> Discuss, debate, and decide who to vote out!',
    )
    .setFooter({ text: roundFooter(round) })
    .setTimestamp();
}

// ─── Vote Phase ──────────────────────────────────────────────────────────────

/**
 * Vote-phase embed. Shows alive players and a progress counter.
 * Individual votes stay hidden until results are revealed.
 */
export function voteEmbed(
  alivePlayers: { id: string; name: string }[],
  voteCount: number,
  totalVoters: number,
  round: number,
): EmbedBuilder {
  const playerList = alivePlayers
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join('\n');

  return new EmbedBuilder()
    .setColor(Colors.Vote)
    .setTitle('⚔️ Voting Phase')
    .setDescription(
      'Vote to eliminate a player! Choose wisely.\n\n' +
      `🗳️ Votes cast: **${voteCount} / ${totalVoters}**`,
    )
    .addFields(
      { name: '👥 Candidates', value: playerList, inline: false },
    )
    .setFooter({ text: roundFooter(round) })
    .setTimestamp();
}

/**
 * Vote results embed — public tally after voting ends.
 */
export function voteResultsEmbed(
  results: { name: string; votes: number }[],
  round: number,
): EmbedBuilder {
  // Sort descending by votes for drama
  const sorted = [...results].sort((a, b) => b.votes - a.votes);
  const lines = sorted.map((r, i) => {
    const bar = '█'.repeat(r.votes) || '░';
    return `${i + 1}. **${r.name}** — ${r.votes} vote${r.votes !== 1 ? 's' : ''} ${bar}`;
  }).join('\n');

  return new EmbedBuilder()
    .setColor(Colors.Vote)
    .setTitle('⚔️ Vote Results')
    .setDescription(lines)
    .setFooter({ text: roundFooter(round) })
    .setTimestamp();
}

// ─── Tie ─────────────────────────────────────────────────────────────────────

/**
 * Displayed when a vote ends in a tie — nobody is eliminated.
 */
export function tieEmbed(tiedNames: string[], round: number): EmbedBuilder {
  const nameList = tiedNames.map(n => `• **${n}**`).join('\n');

  return new EmbedBuilder()
    .setColor(Colors.Discussion)
    .setTitle('⚖️ It\'s a Tie!')
    .setDescription(
      'The vote ended in a tie — **no one is eliminated** this round.\n\n' +
      `Tied players:\n${nameList}\n\n` +
      '> The game continues to the next round!',
    )
    .setFooter({ text: roundFooter(round) })
    .setTimestamp();
}

// ─── Elimination ─────────────────────────────────────────────────────────────

/**
 * Elimination announcement revealing the voted-out player's role.
 */
export function eliminationEmbed(
  playerName: string,
  role: Role,
  word?: string,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Vote)
    .setTitle('💀 Elimination')
    .setDescription(
      `**${playerName}** has been eliminated!\n\n` +
      `${roleEmoji(role)} They were a **${role}**.\n`,
    )
    .setTimestamp();
}

// ─── Mr. White ───────────────────────────────────────────────────────────────

/**
 * Prompt for Mr. White to make their final guess after being eliminated.
 */
export function mrWhiteGuessEmbed(playerName: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.MrWhite)
    .setTitle('🤫 Mr. White — Last Chance!')
    .setDescription(
      `**${playerName}** was Mr. White!\n\n` +
      'They get one final chance to guess the **civilian word**.\n' +
      'If they guess correctly, **Mr. White wins**!',
    )
    .setTimestamp();
}

/**
 * Result of Mr. White's guess attempt.
 */
export function mrWhiteGuessResultEmbed(
  playerName: string,
  guess: string,
  correct: boolean,
  actualWord: string,
): EmbedBuilder {
  if (correct) {
    return new EmbedBuilder()
      .setColor(Colors.MrWhite)
      .setTitle('🤫 Mr. White Guessed Correctly!')
      .setDescription(
        `**${playerName}** guessed \`${guess}\` — and that's **correct**! 🎉\n\n` +
        '**Mr. White wins the game!**',
      )
      .setTimestamp();
  }

  return new EmbedBuilder()
    .setColor(Colors.Vote)
    .setTitle('🤫 Mr. White Guessed Wrong!')
    .setDescription(
      `**${playerName}** guessed \`${guess}\` — but the word was \`${actualWord}\`.\n\n` +
      'Mr. White has been defeated!',
    )
    .setTimestamp();
}

// ─── Game Over ───────────────────────────────────────────────────────────────

/**
 * Final game-over embed with the winner, reason, and full player roster.
 */
export function gameOverEmbed(
  winner: WinnerTeam,
  reason: string,
  allPlayers: Player[],
  civilianWord: string,
  spyWord: string,
): EmbedBuilder {
  const winnerLabel: Record<WinnerTeam, string> = {
    civilians:  '✅ Civilians Win!',
    spy: '🕵️ Spy Wins!',
    mrwhite:    '👻 Mr. White Wins!',
  };

  // Build the player roster
  const roster = allPlayers.map(p => {
    const emoji = p.role ? roleEmoji(p.role) : '❓';
    const status = statusIndicator(p.isAlive);
    const roleName = p.role ?? 'Unknown';
    const wordStr = p.word ? ` — \`${p.word}\`` : ' — *no word*';
    return `${status} ${emoji} **${p.displayName}** — ${roleName}${wordStr}`;
  }).join('\n');

  return new EmbedBuilder()
    .setColor(Colors.GameOver)
    .setTitle(`🏆 Game Over — ${winnerLabel[winner]}`)
    .setDescription(reason)
    .addFields(
      {
        name: '📋 All Players',
        value: roster || '*No players*',
        inline: false,
      },
      {
        name: '📖 Words',
        value: `✅ Civilian: \`${civilianWord}\`\n🕵️ Spy: \`${spyWord}\``,
        inline: false,
      },
    )
    .setFooter({ text: "Who's the Spy • Thanks for playing!" })
    .setTimestamp();
}

// ─── Status ──────────────────────────────────────────────────────────────────

/**
 * Game status embed for `/whosthespy status`.
 * Shows the current phase, player count, round, and alive players.
 */
export function statusEmbed(game: GameState): EmbedBuilder {
  const alive = Array.from(game.players.values()).filter(p => p.isAlive);
  const eliminated = Array.from(game.players.values()).filter(p => !p.isAlive);

  const aliveList = alive.length > 0
    ? alive.map(p => `💚 ${p.displayName}`).join('\n')
    : '*None*';

  const elimList = eliminated.length > 0
    ? eliminated.map(p => `💀 ${p.displayName}`).join('\n')
    : '*None*';

  const embed = new EmbedBuilder()
    .setColor(Colors.Info)
    .setTitle("🎭 Who's the Spy — Game Status")
    .addFields(
      { name: '📍 Phase', value: phaseName(game.phase), inline: true },
      { name: '🔄 Round', value: `${game.round}`, inline: true },
      { name: '👥 Players', value: `${game.players.size} total`, inline: true },
      { name: '💚 Alive', value: aliveList, inline: true },
      { name: '💀 Eliminated', value: elimList, inline: true },
    )
    .setFooter({ text: "Who's the Spy" })
    .setTimestamp();

  return embed;
}
