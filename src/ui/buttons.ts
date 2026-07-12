import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ID, Actions } from '../config.js';

// ─── Lobby Buttons ───────────────────────────────────────────────────────────

/**
 * Main lobby buttons: Join (green), Leave (red), Start Game (blue).
 */
export function lobbyButtons(guildId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ID.make(Actions.Join, guildId))
      .setLabel('Join Game')
      .setEmoji('🎮')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(ID.make(Actions.Leave, guildId))
      .setLabel('Leave')
      .setEmoji('🚪')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(ID.make(Actions.Start, guildId))
      .setLabel('Start Game')
      .setEmoji('🚀')
      .setStyle(ButtonStyle.Primary),
  );
}

// ─── Settings Buttons ────────────────────────────────────────────────────────

/**
 * Settings row with the Mr. White toggle.
 * Label reflects the current state so the host knows what clicking will do.
 */
export function settingsButtons(
  guildId: string,
  mrWhiteEnabled: boolean,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ID.make(Actions.ToggleMrWhite, guildId))
      .setLabel(mrWhiteEnabled ? 'Mr. White: ON' : 'Mr. White: OFF')
      .setEmoji('👻')
      .setStyle(mrWhiteEnabled ? ButtonStyle.Primary : ButtonStyle.Secondary),
      
    new ButtonBuilder()
      .setCustomId(ID.make(Actions.EditSettings, guildId))
      .setLabel('Edit Timers')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Secondary),
  );
}

// ─── Skip Button ─────────────────────────────────────────────────────────────

export function skipDiscussionButton(
  guildId: string,
  skipCount: number,
  totalAlive: number,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ID.make(Actions.SkipDiscussion, guildId))
      .setLabel(`Skip Discussion (${skipCount}/${totalAlive})`)
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary),
  );
}

// ─── Clue Button ─────────────────────────────────────────────────────────────

/**
 * A single "Give Clue" button shown during a player's clue turn.
 */
export function clueButton(guildId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ID.make(Actions.GiveClue, guildId))
      .setLabel('Give Clue')
      .setEmoji('🔍')
      .setStyle(ButtonStyle.Primary),
  );
}

// ─── Vote Buttons ────────────────────────────────────────────────────────────

/** Maximum buttons per action row (Discord limit). */
const MAX_BUTTONS_PER_ROW = 5;

/**
 * Vote buttons — one button per alive player candidate.
 * Splits across multiple action rows if there are more than 5 candidates.
 *
 * @param guildId  - Current guild ID
 * @param alivePlayers - Candidates available for voting (pre-filtered by caller)
 * @returns One or more action rows of vote buttons
 */
export function voteButtons(
  guildId: string,
  alivePlayers: { id: string; name: string }[],
): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();
  let count = 0;

  for (const player of alivePlayers) {
    if (count > 0 && count % MAX_BUTTONS_PER_ROW === 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
    }

    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(ID.make(Actions.Vote, guildId, player.id))
        .setLabel(player.name)
        .setStyle(ButtonStyle.Secondary),
    );
    count++;
  }

  // Add the skip button
  if (count > 0 && count % MAX_BUTTONS_PER_ROW === 0) {
    rows.push(currentRow);
    currentRow = new ActionRowBuilder<ButtonBuilder>();
  }
  
  currentRow.addComponents(
    new ButtonBuilder()
      .setCustomId(ID.make(Actions.Vote, guildId, 'SKIP'))
      .setLabel('Skip Vote')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Danger),
  );
  
  rows.push(currentRow);

  return rows;
}

// ─── Mr. White Guess Button ─────────────────────────────────────────────────

/**
 * Button for Mr. White to open the guess modal after elimination.
 */
export function mrWhiteGuessButton(guildId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(ID.make(Actions.MrWhiteGuess, guildId))
      .setLabel('Guess the Word')
      .setEmoji('🤫')
      .setStyle(ButtonStyle.Danger),
  );
}
