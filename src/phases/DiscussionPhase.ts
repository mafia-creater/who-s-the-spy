import { TextChannel, type Message } from 'discord.js';
import type { GameState } from '../types.js';
import { GamePhase } from '../types.js';
import { discussionEmbed } from '../ui/embeds.js';
import { createTimer, delay } from '../utils/timer.js';

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
  try {
    phaseMsg = await channel.send({
      embeds: [discussionEmbed(totalSeconds, round)],
    });
    game.phaseMessageId = phaseMsg.id;
  } catch (error) {
    console.error('[DiscussionPhase] Failed to send discussion embed:', error);
    return;
  }

  // ── Countdown with periodic updates ─────────────────────────────────────
  const updateIntervalSec = 15;
  let secondsRemaining = totalSeconds;

  while (secondsRemaining > 0) {
    if (game.forceEnded) return;

    // Determine how long to wait before next update
    const waitSec = Math.min(updateIntervalSec, secondsRemaining);
    const timer = createTimer(waitSec);

    // Check for force-end while waiting
    const completed = await timer.promise;

    if (game.forceEnded) {
      timer.cancel();
      return;
    }

    secondsRemaining -= waitSec;

    // Update the embed with the new remaining time
    if (secondsRemaining > 0) {
      try {
        await phaseMsg.edit({
          embeds: [discussionEmbed(secondsRemaining, round)],
        });
      } catch {
        // Message may have been deleted
      }
    }
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
