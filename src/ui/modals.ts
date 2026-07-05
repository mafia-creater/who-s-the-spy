import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';
import { ID, Actions } from '../config.js';

// ─── Clue Modal ──────────────────────────────────────────────────────────────

/**
 * Modal shown when a player clicks "Give Clue" on their turn.
 * Contains a single short text input for their clue word or phrase.
 *
 * @param guildId - Current guild ID (encoded in the custom ID)
 * @param round   - Current round number (shown in the title)
 */
export function clueModal(guildId: string, round: number): ModalBuilder {
  const clueInput = new TextInputBuilder()
    .setCustomId('clue_input')
    .setLabel('Your clue (word or short phrase)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(50)
    .setRequired(true)
    .setPlaceholder('e.g. "juicy" or "tropical fruit"');

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(clueInput);

  return new ModalBuilder()
    .setCustomId(ID.make(Actions.ClueModal, guildId))
    .setTitle(`Submit Your Clue — Round ${round}`)
    .addComponents(row);
}

// ─── Mr. White Guess Modal ───────────────────────────────────────────────────

/**
 * Modal shown when Mr. White clicks "Guess the Word" after elimination.
 * Contains a single short text input for their guess of the civilian word.
 *
 * @param guildId - Current guild ID (encoded in the custom ID)
 */
export function mrWhiteGuessModal(guildId: string): ModalBuilder {
  const guessInput = new TextInputBuilder()
    .setCustomId('guess_input')
    .setLabel('What is the civilian word?')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(50)
    .setRequired(true)
    .setPlaceholder('Type your guess here…');

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(guessInput);

  return new ModalBuilder()
    .setCustomId(ID.make(Actions.MrWhiteGuessModal, guildId))
    .setTitle('Mr. White — Guess the Word!')
    .addComponents(row);
}

// ─── Edit Settings Modal ─────────────────────────────────────────────────────

import type { GameSettings } from '../types.js';

export function editSettingsModal(settings: GameSettings, guildId: string): ModalBuilder {
  const clueInput = new TextInputBuilder()
    .setCustomId('clueTimer')
    .setLabel('Clue Phase Timer (seconds)')
    .setStyle(TextInputStyle.Short)
    .setValue(settings.clueTimerSeconds.toString())
    .setRequired(true);

  const discussionInput = new TextInputBuilder()
    .setCustomId('discussionTimer')
    .setLabel('Discussion Phase Timer (seconds)')
    .setStyle(TextInputStyle.Short)
    .setValue(settings.discussionTimerSeconds.toString())
    .setRequired(true);

  const voteInput = new TextInputBuilder()
    .setCustomId('voteTimer')
    .setLabel('Voting Phase Timer (seconds)')
    .setStyle(TextInputStyle.Short)
    .setValue(settings.voteTimerSeconds.toString())
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(ID.make(Actions.EditSettingsModal, guildId))
    .setTitle('Edit Game Timers')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(clueInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(discussionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(voteInput)
    );
}
