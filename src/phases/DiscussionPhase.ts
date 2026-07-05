import { TextChannel, type Message } from 'discord.js';
import type { GameState } from '../types.js';
import { GamePhase } from '../types.js';
import { discussionEmbed } from '../ui/embeds.js';
import { skipDiscussionButton } from '../ui/buttons.js';
import { createTimer, delay } from '../utils/timer.js';
import { ID, Actions } from '../config.js';

// ─── Discussion Phase ────────────────────────────────────────────────────────

/**
 * Run the discussion phase.
 *
 * Posts a discussion embed with a countdown timer that updates at 15-second
 * intervals. Players use this time to discuss clues and strategise before
 * voting.
 *
 * @param game    - The current game state.
 * @param channel - The text channel for the discussion embed.
 */
export async function runDiscussionPhase(
  game: GameState,
  channel: TextChannel,
): Promise<void> {
  game.phase = GamePhase.Discussion;

  const { round, settings } = game;
  const totalSeconds = settings.discussionTimerSeconds;

  // ── Send the initial discussion embed ───────────────────────────────────
  let phaseMsg: Message | undefined;
  
  const alivePlayers = [...game.players.values()].filter(p => p.isAlive);
  const skippedPlayers = new Set<string>();

  try {
    phaseMsg = await channel.send({
      embeds: [discussionEmbed(totalSeconds, round)],
      components: [skipDiscussionButton(game.guildId, skippedPlayers.size, alivePlayers.length)],
    });
    game.phaseMessageId = phaseMsg.id;
  } catch (error) {
    console.error('[DiscussionPhase] Failed to send discussion embed:', error);
    return;
  }

  // ── Skip Button Collector ───────────────────────────────────────────────
  const collector = phaseMsg.createMessageComponentCollector({
    filter: (i) => {
      const parsed = ID.parse(i.customId);
      return parsed !== null && parsed.guildId === game.guildId;
    },
    time: totalSeconds * 1000,
  });

  let skipTriggered = false;

  collector.on('collect', async (interaction) => {
    try {
      const parsed = ID.parse(interaction.customId);
      if (parsed?.action === Actions.SkipDiscussion) {
        const userId = interaction.user.id;
        if (!game.players.get(userId)?.isAlive) {
          await interaction.reply({ content: '⚠️ Only alive players can skip!', flags: ['Ephemeral'] });
          return;
        }

        skippedPlayers.add(userId);

        if (skippedPlayers.size >= alivePlayers.length) {
          skipTriggered = true;
          await interaction.deferUpdate();
          collector.stop('skipped');
          return;
        }

        await interaction.update({
          components: [skipDiscussionButton(game.guildId, skippedPlayers.size, alivePlayers.length)]
        });
      }
    } catch (e) {
      console.error('[DiscussionPhase] Skip button error:', e);
    }
  });

  // ── Countdown with periodic updates ─────────────────────────────────────
  const updateIntervalSec = 15;
  let secondsRemaining = totalSeconds;

  while (secondsRemaining > 0 && !skipTriggered) {
    if (game.forceEnded) {
      collector.stop('forceEnded');
      return;
    }

    // Use createTimer so we can cancel it if skip is triggered
    const waitTime = Math.min(secondsRemaining, updateIntervalSec);
    const stepTimer = createTimer(waitTime);
    
    // Also listen for collector end to cancel timer early
    collector.once('end', () => stepTimer.cancel());

    const naturalCompletion = await stepTimer.promise;

    if (skipTriggered || game.forceEnded) break;

    if (naturalCompletion) {
      secondsRemaining -= waitTime;
      if (game.forceEnded) break;

      // Update the embed
      if (secondsRemaining > 0 && secondsRemaining % updateIntervalSec === 0) {
        try {
          await phaseMsg.edit({
            embeds: [discussionEmbed(secondsRemaining, round)],
            components: [skipDiscussionButton(game.guildId, skippedPlayers.size, alivePlayers.length)],
          });
        } catch {
          // Message might have been deleted, ignore
        }
      }
    }
  }

  if (!collector.ended) {
    collector.stop('timer_end');
  }

  // Remove skip button when phase ends
  try {
    await phaseMsg.edit({
      components: []
    });
  } catch (e) {
    // Ignore
  }

  // ── Discussion over ─────────────────────────────────────────────────────
  try {
    await phaseMsg.edit({
      embeds: [discussionEmbed(0, round)],
    });
  } catch {
    // Message may have been deleted
  }

  await delay(1_500);
}
