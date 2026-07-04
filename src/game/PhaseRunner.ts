import { TextChannel } from 'discord.js';
import type { GameState } from '../types.js';
import { GamePhase } from '../types.js';
import { gameManager } from './GameManager.js';
import { assignRoles } from './RoleAssigner.js';
import { safeDM } from '../utils/dmSender.js';
import { shuffle } from '../utils/shuffle.js';
import { delay } from '../utils/timer.js';
import { roleAssignedEmbed, gameOverEmbed } from '../ui/embeds.js';
import { runCluePhase } from '../phases/CluePhase.js';
import { runDiscussionPhase } from '../phases/DiscussionPhase.js';
import { runVotePhase } from '../phases/VotePhase.js';
import { runEliminationPhase } from '../phases/EliminationPhase.js';

// ─── PhaseRunner ─────────────────────────────────────────────────────────────

/**
 * Run the full lifecycle of an Who's the Spy game.
 *
 * 1. Assigns roles and DMs every player their secret role/word.
 * 2. Loops through Clue → Discussion → Vote → Elimination phases.
 * 3. Ends when a win condition is met, the game is force-ended, or an error occurs.
 * 4. Always cleans up the game from the manager on exit.
 *
 * @param game    - The game state (already populated with players from the lobby).
 * @param channel - The text channel where the game is being played.
 */
export async function runGame(game: GameState, channel: TextChannel): Promise<void> {
  try {
    // ── Phase 1: Role Assignment ──────────────────────────────────────────
    await assignAndNotifyRoles(game, channel);

    // Small pause before the first round begins
    await delay(2000);

    // ── Phase 2: Main Game Loop ──────────────────────────────────────────
    while (!game.forceEnded) {
      // Shuffle alive players to set a new turn order each round
      const aliveIds = [...game.players.entries()]
        .filter(([, p]) => p.isAlive)
        .map(([id]) => id);
      game.turnOrder = shuffle([...aliveIds]);
      game.currentTurnIndex = 0;

      // ── Clue Phase ──────────────────────────────────────────────────────
      game.phase = GamePhase.Clue;
      await runCluePhase(game, channel);
      if (game.forceEnded) break;

      await delay(2000);

      // ── Discussion Phase ────────────────────────────────────────────────
      game.phase = GamePhase.Discussion;
      await runDiscussionPhase(game, channel);
      if (game.forceEnded) break;

      await delay(2000);

      // ── Vote Phase ──────────────────────────────────────────────────────
      game.phase = GamePhase.Vote;
      const eliminatedId = await runVotePhase(game, channel);
      if (game.forceEnded) break;

      await delay(2000);

      // ── Handle Tie (no elimination) ─────────────────────────────────────
      if (eliminatedId === null) {
        game.round++;
        resetRoundState(game);
        continue;
      }

      // ── Elimination Phase ───────────────────────────────────────────────
      game.phase = GamePhase.Elimination;
      const result = await runEliminationPhase(game, channel, eliminatedId);
      if (game.forceEnded) break;

      // ── Check Win Condition ─────────────────────────────────────────────
      if (result.gameOver) {
        game.phase = GamePhase.GameOver;

        const allPlayers = [...game.players.values()];
        await channel.send({
          embeds: [
            gameOverEmbed(
              result.winner!,
              result.reason,
              allPlayers,
              game.civilianWord,
              game.spyWord,
            ),
          ],
        });
        break;
      }

      // ── Prepare Next Round ──────────────────────────────────────────────
      game.round++;
      resetRoundState(game);

      await delay(2000);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[PhaseRunner] Fatal error in guild ${game.guildId}: ${message}`);

    try {
      await channel.send(
        `❌ **An unexpected error occurred and the game has ended.**\n\`\`\`${message}\`\`\``,
      );
    } catch {
      // Channel may no longer be accessible — nothing we can do
    }
  } finally {
    // ── Cleanup ─────────────────────────────────────────────────────────
    gameManager.endGame(game.guildId);
  }
}

// ─── Role Assignment & DM Notification ─────────────────────────────────────

/**
 * Assign roles to all players and DM each one their role embed.
 * Posts a warning in the channel for any players whose DMs failed.
 */
async function assignAndNotifyRoles(
  game: GameState,
  channel: TextChannel,
): Promise<void> {
  game.phase = GamePhase.RoleAssignment;
  assignRoles(game);

  const client = channel.client;
  const dmFailures: string[] = [];

  // DM each player concurrently
  const dmPromises = [...game.players.values()].map(async (player) => {
    try {
      const user = await client.users.fetch(player.userId);
      const embed = roleAssignedEmbed(player.role!, player.word);
      const result = await safeDM(user, { embeds: [embed] });

      if (!result.success) {
        player.dmFailed = true;
        dmFailures.push(player.displayName);
      }
    } catch {
      player.dmFailed = true;
      dmFailures.push(player.displayName);
    }
  });

  await Promise.all(dmPromises);

  // Notify the channel about DM failures
  if (dmFailures.length > 0) {
    const names = dmFailures.map((n) => `• **${n}**`).join('\n');
    await channel.send(
      `⚠️ **Could not DM the following players** (they can still play but might not know their role):\n${names}\n\n` +
      `> These players should enable **DMs from server members** in their privacy settings.`,
    );
  }

  await channel.send('🎭 **Roles have been assigned!** Check your DMs. The game begins shortly…');
}

// ─── Round State Reset ──────────────────────────────────────────────────────

/**
 * Reset per-round state between rounds:
 * - Clear `hasGivenClue` for all alive players
 * - Clear all votes
 */
function resetRoundState(game: GameState): void {
  for (const player of game.players.values()) {
    if (player.isAlive) {
      player.hasGivenClue = false;
    }
  }
  game.votes.clear();
}
