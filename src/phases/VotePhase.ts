import { TextChannel, ComponentType, type Message } from 'discord.js';
import type { GameState } from '../types.js';
import { GamePhase } from '../types.js';
import { ID, Actions } from '../config.js';
import { voteEmbed, voteResultsEmbed, tieEmbed } from '../ui/embeds.js';
import { voteButtons } from '../ui/buttons.js';
import { delay } from '../utils/timer.js';

// ─── Vote Phase ──────────────────────────────────────────────────────────────

/**
 * Run the voting phase for the current round.
 *
 * Posts a vote embed with one button per alive player. Collects votes,
 * prevents self-voting, allows vote changes, and tallies results.
 *
 * @param game    - The current game state.
 * @param channel - The text channel for the vote embed.
 * @returns The user ID of the player who was voted out, or `null` if the
 *          vote ended in a tie (no elimination).
 */
export async function runVotePhase(
  game: GameState,
  channel: TextChannel,
): Promise<string | null> {
  game.phase = GamePhase.Vote;
  game.votes.clear();

  const { guildId, round, settings } = game;

  // Build the alive players list
  const alivePlayers: { id: string; name: string }[] = [];
  for (const player of game.players.values()) {
    if (player.isAlive) {
      alivePlayers.push({ id: player.userId, name: player.displayName });
    }
  }

  const totalVoters = alivePlayers.length;

  // ── Send the vote embed with buttons ────────────────────────────────────
  const buttonRows = voteButtons(guildId, alivePlayers);

  let phaseMsg: Message | undefined;
  try {
    phaseMsg = await channel.send({
      embeds: [voteEmbed(alivePlayers, 0, totalVoters, round)],
      components: buttonRows,
    });
    game.phaseMessageId = phaseMsg.id;
  } catch (error) {
    console.error('[VotePhase] Failed to send vote embed:', error);
    return null;
  }

  // ── Collect votes ──────────────────────────────────────────────────────
  return new Promise<string | null>((resolve) => {
    let resolved = false;

    const finish = (result: string | null): void => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    const collector = phaseMsg!.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: settings.voteTimerSeconds * 1_000,
      filter: (i) => {
        const parsed = ID.parse(i.customId);
        return (
          parsed?.action === Actions.Vote &&
          parsed.guildId === guildId
        );
      },
    });

    collector.on('collect', async (interaction) => {
      if (resolved) return;

      const parsed = ID.parse(interaction.customId);
      if (!parsed?.extra) return;

      const voterId = interaction.user.id;
      const targetId = parsed.extra;

      try {
        // Verify the voter is an alive player
        const voter = game.players.get(voterId);
        if (!voter || !voter.isAlive) {
          await interaction.reply({
            content: '⚠️ You cannot vote — you are not an active player!',
            ephemeral: true,
          });
          return;
        }

        // Prevent self-voting
        if (targetId === voterId) {
          await interaction.reply({
            content: '⚠️ You cannot vote for yourself!',
            ephemeral: true,
          });
          return;
        }

        // Verify the target is an alive player
        const target = game.players.get(targetId);
        if (!target || !target.isAlive) {
          await interaction.reply({
            content: '⚠️ That player is not available for voting!',
            ephemeral: true,
          });
          return;
        }

        // Record/update the vote
        const previousVote = game.votes.get(voterId);
        game.votes.set(voterId, targetId);

        const previousTarget = previousVote ? game.players.get(previousVote) : undefined;
        const voteMsg = previousVote
          ? `🗳️ Vote changed from **${previousTarget?.displayName ?? 'Unknown'}** to **${target.displayName}**.`
          : `🗳️ You voted for **${target.displayName}**.`;

        await interaction.reply({
          content: voteMsg,
          ephemeral: true,
        });

        // Update the vote count on the embed
        try {
          await phaseMsg!.edit({
            embeds: [voteEmbed(alivePlayers, game.votes.size, totalVoters, round)],
          });
        } catch {
          // Message may have been deleted
        }

        // If all alive players have voted, end early
        if (game.votes.size >= totalVoters) {
          collector.stop('all_voted');
        }
      } catch (error) {
        console.error('[VotePhase] Vote interaction error:', error);
      }
    });

    collector.on('end', async () => {
      if (resolved) return;

      // Remove buttons
      try {
        await phaseMsg!.edit({ components: [] });
      } catch {
        // Message may have been deleted
      }

      // ── Tally votes ─────────────────────────────────────────────────
      const tally = new Map<string, number>();
      for (const player of alivePlayers) {
        tally.set(player.id, 0);
      }
      for (const targetId of game.votes.values()) {
        tally.set(targetId, (tally.get(targetId) ?? 0) + 1);
      }

      // Build results for the embed
      const results: { name: string; votes: number; id: string }[] = [];
      for (const player of alivePlayers) {
        results.push({
          id: player.id,
          name: player.name,
          votes: tally.get(player.id) ?? 0,
        });
      }

      // Post vote results
      try {
        await channel.send({
          embeds: [voteResultsEmbed(results, round)],
        });
      } catch {
        // Channel may be unavailable
      }

      await delay(1_500);

      // ── Determine outcome ───────────────────────────────────────────
      const maxVotes = Math.max(...results.map((r) => r.votes));

      // Nobody voted
      if (maxVotes === 0) {
        try {
          await channel.send({
            embeds: [tieEmbed([], round)],
          });
        } catch {
          // Channel unavailable
        }
        finish(null);
        return;
      }

      const topPlayers = results.filter((r) => r.votes === maxVotes);

      // Tie — no elimination
      if (topPlayers.length > 1) {
        const tiedNames = topPlayers.map((p) => p.name);
        try {
          await channel.send({
            embeds: [tieEmbed(tiedNames, round)],
          });
        } catch {
          // Channel unavailable
        }
        finish(null);
        return;
      }

      // Single winner — they are eliminated
      finish(topPlayers[0].id);
    });
  });
}
