import { TextChannel, ComponentType, type Message } from 'discord.js';
import type { GameState } from '../types.js';
import { GamePhase } from '../types.js';
import { ID, Actions } from '../config.js';
import { cluePhaseEmbed } from '../ui/embeds.js';
import { clueButton } from '../ui/buttons.js';
import { clueModal } from '../ui/modals.js';
import { delay } from '../utils/timer.js';

// ─── Clue Phase ──────────────────────────────────────────────────────────────

/**
 * Run the clue phase for the current round.
 *
 * Iterates through each alive player in turn order, presenting them with a
 * "Give Clue" button that opens a modal. Clues are collected and displayed
 * in the channel embed. If a player doesn't submit in time, `[No clue]` is
 * recorded automatically.
 *
 * @param game    - The current game state.
 * @param channel - The text channel for phase embeds.
 */
export async function runCluePhase(
  game: GameState,
  channel: TextChannel,
): Promise<void> {
  game.phase = GamePhase.Clue;

  const { guildId, round } = game;

  // Filter turn order to only alive players for this round
  const aliveTurnOrder = game.turnOrder.filter((id) => {
    const player = game.players.get(id);
    return player?.isAlive === true;
  });

  // Reset clue tracking for all alive players this round
  for (const id of aliveTurnOrder) {
    const player = game.players.get(id);
    if (player) player.hasGivenClue = false;
  }

  // Collect clues as { name, clue } pairs for the embed
  const cluesThisRound: { name: string; clue: string }[] = [];

  // Post the initial clue phase message
  const firstPlayer = game.players.get(aliveTurnOrder[0]);
  let phaseMsg: Message | undefined;

  try {
    phaseMsg = await channel.send({
      embeds: [
        cluePhaseEmbed(
          aliveTurnOrder.map((id) => game.players.get(id)!.displayName),
          firstPlayer?.displayName ?? 'Unknown',
          0,
          cluesThisRound,
          round,
        ),
      ],
      components: [clueButton(guildId)],
    });
    game.phaseMessageId = phaseMsg.id;
  } catch (error) {
    console.error('[CluePhase] Failed to send phase message:', error);
    return;
  }

  // ── Iterate through each alive player's turn ──────────────────────────
  for (let turnIdx = 0; turnIdx < aliveTurnOrder.length; turnIdx++) {
    if (game.forceEnded) return;

    const playerId = aliveTurnOrder[turnIdx];
    const player = game.players.get(playerId);
    if (!player) continue;

    game.currentTurnIndex = turnIdx;

    // Update the embed to show whose turn it is
    try {
      await phaseMsg.edit({
        embeds: [
          cluePhaseEmbed(
            aliveTurnOrder.map((id) => game.players.get(id)!.displayName),
            player.displayName,
            turnIdx,
            cluesThisRound,
            round,
          ),
        ],
        components: [clueButton(guildId)],
      });
    } catch {
      // Message may have been deleted
    }

    // ── Collect the clue via button + modal ───────────────────────────
    const clue = await collectClueFromPlayer(
      phaseMsg,
      game,
      playerId,
      player.displayName,
    );

    // Store the clue
    const playerClues = game.clues.get(playerId) ?? [];
    playerClues.push(clue);
    game.clues.set(playerId, playerClues);
    player.hasGivenClue = true;

    cluesThisRound.push({ name: player.displayName, clue });

    // Update embed to show the submitted clue
    try {
      await phaseMsg.edit({
        embeds: [
          cluePhaseEmbed(
            aliveTurnOrder.map((id) => game.players.get(id)!.displayName),
            player.displayName,
            turnIdx + 1, // Move cursor past this player
            cluesThisRound,
            round,
          ),
        ],
        components: turnIdx < aliveTurnOrder.length - 1
          ? [clueButton(guildId)]
          : [], // Remove button on last player
      });
    } catch {
      // Message may have been deleted
    }

    // Small delay between turns for readability
    if (turnIdx < aliveTurnOrder.length - 1) {
      await delay(1_500);
    }
  }

  // ── Post final clue summary ───────────────────────────────────────────
  try {
    await phaseMsg.edit({
      embeds: [
        cluePhaseEmbed(
          aliveTurnOrder.map((id) => game.players.get(id)!.displayName),
          '', // No current player — all done
          aliveTurnOrder.length,
          cluesThisRound,
          round,
        ),
      ],
      components: [],
    });
  } catch {
    // Message may have been deleted
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Collect a single clue from a player via the Give Clue button → modal flow.
 *
 * @returns The submitted clue string, or `[No clue]` on timeout.
 */
async function collectClueFromPlayer(
  message: Message,
  game: GameState,
  playerId: string,
  playerName: string,
): Promise<string> {
  const { guildId, round, settings } = game;
  const timerMs = settings.clueTimerSeconds * 1_000;

  return new Promise<string>((resolve) => {
    let resolved = false;

    const finish = (clue: string): void => {
      if (resolved) return;
      resolved = true;
      collector.stop('done');
      resolve(clue);
    };

    // Collect the "Give Clue" button click
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: timerMs,
      filter: (i) => {
        const parsed = ID.parse(i.customId);
        return (
          parsed?.action === Actions.GiveClue &&
          parsed.guildId === guildId &&
          i.user.id === playerId
        );
      },
    });

    collector.on('collect', async (interaction) => {
      if (resolved) return;

      try {
        // Show the clue modal
        await interaction.showModal(clueModal(guildId, round));

        // Wait for the modal submission
        const modalInteraction = await interaction.awaitModalSubmit({
          time: timerMs,
          filter: (mi) => {
            const parsed = ID.parse(mi.customId);
            return (
              parsed?.action === Actions.ClueModal &&
              parsed.guildId === guildId &&
              mi.user.id === playerId
            );
          },
        });

        // Extract and validate the clue
        const rawClue = modalInteraction.fields.getTextInputValue('clue_input').trim();
        const player = game.players.get(playerId);

        // Reject if the clue exactly matches the player's word
        if (player?.word && rawClue.toLowerCase() === player.word.toLowerCase()) {
          await modalInteraction.reply({
            content: '⚠️ You cannot use your exact word as a clue! Try something else.',
            ephemeral: true,
          });
          // Don't resolve — let the collector keep listening for another attempt
          return;
        }

        // Accept the clue
        await modalInteraction.reply({
          content: `✅ Clue submitted: **"${rawClue}"**`,
          ephemeral: true,
        });

        finish(rawClue);
      } catch (error) {
        // Modal timed out or interaction failed
        if (!resolved) {
          console.error(`[CluePhase] Modal error for ${playerName}:`, error);
        }
      }
    });

    collector.on('end', (_collected, reason) => {
      if (!resolved) {
        // Timer expired without a clue — record default
        finish('[No clue]');
      }
    });
  });
}
