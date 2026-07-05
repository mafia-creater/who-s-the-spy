import { TextChannel, ComponentType, type Message } from 'discord.js';
import type { GameState, WinCheckResult } from '../types.js';
import { GamePhase, Role } from '../types.js';
import { ID, Actions } from '../config.js';
import { eliminationEmbed, mrWhiteGuessEmbed, mrWhiteGuessResultEmbed } from '../ui/embeds.js';
import { mrWhiteGuessButton } from '../ui/buttons.js';
import { mrWhiteGuessModal } from '../ui/modals.js';
import { checkWin } from '../game/WinChecker.js';
import { delay } from '../utils/timer.js';

// ─── Elimination Phase ───────────────────────────────────────────────────────

/**
 * Run the elimination phase for a voted-out player.
 *
 * Marks the player as eliminated, reveals their role to the channel, and
 * handles the Mr. White last-chance guess mechanic if applicable. Finally
 * runs a win condition check and returns the result.
 *
 * @param game         - The current game state.
 * @param channel      - The text channel for phase embeds.
 * @param eliminatedId - The user ID of the player who was voted out.
 * @returns A {@link WinCheckResult} indicating whether the game is over.
 */
export async function runEliminationPhase(
  game: GameState,
  channel: TextChannel,
  eliminatedId: string,
): Promise<WinCheckResult> {
  game.phase = GamePhase.Elimination;

  const player = game.players.get(eliminatedId);
  if (!player) {
    return { gameOver: false, reason: 'Eliminated player not found.' };
  }

  // ── Mark the player as eliminated ─────────────────────────────────────
  player.isAlive = false;
  game.eliminatedPlayers.push(eliminatedId);

  // ── Reveal the eliminated player's role ────────────────────────────────
  try {
    await channel.send({
      embeds: [eliminationEmbed(player.displayName, player.role!, player.word)],
    });
  } catch (error) {
    console.error('[EliminationPhase] Failed to send elimination embed:', error);
  }

  await delay(2_000);

  // ── Mr. White last-chance guess ────────────────────────────────────────
  if (player.role === Role.MrWhite) {
    const mrWhiteResult = await handleMrWhiteGuess(game, channel, player.displayName);
    if (mrWhiteResult) {
      return mrWhiteResult;
    }
  }

  // ── Check win condition ────────────────────────────────────────────────
  return checkWin(game);
}

// ─── Mr. White Guess Handler ─────────────────────────────────────────────────

/**
 * Handle the Mr. White last-chance guess mechanic.
 *
 * Posts a prompt embed with a "Guess the Word" button. If Mr. White clicks
 * it, a modal collects their guess. If the guess matches the civilian word,
 * Mr. White wins immediately.
 *
 * @returns A winning {@link WinCheckResult} if Mr. White guessed correctly,
 *          or `null` if the guess was wrong or timed out.
 */
async function handleMrWhiteGuess(
  game: GameState,
  channel: TextChannel,
  playerName: string,
): Promise<WinCheckResult | null> {
  const { guildId } = game;
  const mrWhitePlayer = Array.from(game.players.values()).find(
    (p) => p.role === Role.MrWhite && p.displayName === playerName,
  );
  if (!mrWhitePlayer) return null;

  game.phase = GamePhase.MrWhiteGuess;

  // Post the guess prompt
  let guessMsg: Message | undefined;
  try {
    guessMsg = await channel.send({
      embeds: [mrWhiteGuessEmbed(playerName)],
      components: [mrWhiteGuessButton(guildId)],
    });
  } catch (error) {
    console.error('[EliminationPhase] Failed to send Mr. White guess embed:', error);
    return null;
  }

  // ── Collect the guess ──────────────────────────────────────────────────
  return new Promise<WinCheckResult | null>((resolve) => {
    let resolved = false;

    const finish = (result: WinCheckResult | null): void => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    const collector = guessMsg!.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30_000, // 30 seconds to click the button
      filter: (i) => {
        const parsed = ID.parse(i.customId);
        return (
          parsed?.action === Actions.MrWhiteGuess &&
          parsed.guildId === guildId &&
          i.user.id === mrWhitePlayer.userId
        );
      },
      max: 1,
    });

    collector.on('collect', async (interaction) => {
      if (resolved) return;

      try {
        // Show the guess modal
        await interaction.showModal(mrWhiteGuessModal(guildId));

        // Await the modal submission
        const modalInteraction = await interaction.awaitModalSubmit({
          time: 30_000,
          filter: (mi) => {
            const parsed = ID.parse(mi.customId);
            return (
              parsed?.action === Actions.MrWhiteGuessModal &&
              parsed.guildId === guildId &&
              mi.user.id === mrWhitePlayer.userId
            );
          },
        });

        // Extract the guess
        const guess = modalInteraction.fields
          .getTextInputValue('guess_input')
          .trim();

        // Compare to the civilian word (case-insensitive)
        const correct =
          guess.toLowerCase() === game.civilianWord.toLowerCase();

        // Acknowledge the modal
        await modalInteraction.reply({
          content: correct
            ? '🎉 You guessed correctly!'
            : '❌ Wrong guess!',
          flags: ['Ephemeral'],
        });

        // Post the result to the channel
        try {
          await channel.send({
            embeds: [
              mrWhiteGuessResultEmbed(
                playerName,
                guess,
                correct,
                game.civilianWord,
              ),
            ],
          });
        } catch {
          // Channel may be unavailable
        }

        // Remove buttons from the guess message
        try {
          await guessMsg!.edit({ components: [] });
        } catch {
          // Message may have been deleted
        }

        await delay(2_000);

        if (correct) {
          finish({
            gameOver: true,
            winner: 'mrwhite',
            reason:
              `**${playerName}** (Mr. White) correctly guessed the civilian word ` +
              `"**${game.civilianWord}**"! Mr. White wins! 👻🎉`,
          });
        } else {
          finish(null);
        }
      } catch (error) {
        // Modal timed out or interaction failed
        console.error('[EliminationPhase] Mr. White modal error:', error);
        if (!resolved) {
          // Remove buttons on failure
          try {
            await guessMsg!.edit({ components: [] });
          } catch {
            // Ignore
          }
          finish(null);
        }
      }
    });

    collector.on('end', async (_collected, reason) => {
      if (resolved) return;

      // Mr. White didn't click the button in time
      try {
        await guessMsg!.edit({ components: [] });
        await channel.send({
          content: `⏰ **${playerName}** (Mr. White) ran out of time to guess!`,
        });
      } catch {
        // Message may have been deleted
      }

      finish(null);
    });
  });
}
