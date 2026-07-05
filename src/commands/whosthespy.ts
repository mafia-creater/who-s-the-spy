import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { gameManager } from '../game/GameManager.js';
import { runGame } from '../game/PhaseRunner.js';
import { runLobbyPhase } from '../phases/LobbyPhase.js';
import { statusEmbed } from '../ui/embeds.js';
import { Colors } from '../config.js';

// ─── Command Definition ──────────────────────────────────────────────────────

/**
 * Slash command builder for `/undercover`.
 *
 * Subcommands:
 * - `start` — Start a new Who's the Spy game in the current channel.
 * - `status` — View the current game's status.
 * - `end`   — Force-end the current game (host or ManageGuild only).
 */
export const data = new SlashCommandBuilder()
  .setName('whosthespy')
  .setDescription("Play the Who's the Spy social deduction game!")
  .addSubcommand((sub) =>
    sub.setName('start').setDescription("Start a new Who's the Spy game"),
  )
  .addSubcommand((sub) =>
    sub.setName('status').setDescription('View current game status'),
  )
  .addSubcommand((sub) =>
    sub.setName('end').setDescription('Force-end the current game'),
  );

// ─── Command Handler ─────────────────────────────────────────────────────────

/**
 * Execute the `/undercover` slash command.
 * Routes to the appropriate subcommand handler.
 *
 * @param interaction - The slash command interaction from Discord.
 */
export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'start':
      await handleStart(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
    case 'end':
      await handleEnd(interaction);
      break;
    default:
      await interaction.reply({
        content: '❌ Unknown subcommand.',
        flags: ['Ephemeral'],
      });
  }
}

// ─── Subcommand: start ──────────────────────────────────────────────────────

/**
 * Handle `/whosthespy start`.
 *
 * Creates a new game, opens the lobby for players to join, and once the lobby
 * phase completes (host clicks Start), transitions into the full game loop.
 */
async function handleStart(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;

  if (!guildId) {
    await interaction.reply({
      content: '❌ This command can only be used in a server.',
      flags: ['Ephemeral'],
    });
    return;
  }

  // Prevent duplicate games
  if (gameManager.hasGame(guildId)) {
    await interaction.reply({
      content:
        '❌ A game is already running in this server! Use `/whosthespy end` to stop it first.',
      flags: ['Ephemeral'],
    });
    return;
  }

  const channel = interaction.channel;
  if (!(channel instanceof TextChannel)) {
    await interaction.reply({
      content: '❌ This command must be used in a text channel.',
      flags: ['Ephemeral'],
    });
    return;
  }

  // Create the game state
  const game = gameManager.createGame(guildId, channelId, interaction.user.id);

  // Automatically add the host to the game
  game.players.set(interaction.user.id, {
    userId: interaction.user.id,
    username: interaction.user.username,
    displayName: interaction.member && 'displayName' in interaction.member
      ? (interaction.member.displayName as string)
      : interaction.user.displayName,
    isAlive: true,
    hasGivenClue: false,
    dmFailed: false,
  });

  // Acknowledge the interaction immediately
  await interaction.reply({
    content: '🎭 **Setting up Undercover…** The lobby will appear below!',
    flags: ['Ephemeral'],
  });

  // Run the lobby phase — the lobby embed is posted as a separate channel
  // message so button collectors can edit it freely.
  try {
    const started = await runLobbyPhase(game, channel);

    if (started) {
      // Lobby completed successfully — transition to the game
      await runGame(game, channel);
    } else {
      // Lobby was cancelled or timed out
      gameManager.endGame(guildId);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[undercover:start] Error: ${message}`);

    try {
      await channel.send(
        `❌ **Failed to start the game.**\n\`\`\`${message}\`\`\``,
      );
    } catch {
      // Channel send failed — nothing we can do
    }

    gameManager.endGame(guildId);
  }
}

// ─── Subcommand: status ─────────────────────────────────────────────────────

/**
 * Handle `/whosthespy status`.
 *
 * Displays the current game state, or an ephemeral message if no game exists.
 */
async function handleStatus(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: '❌ This command can only be used in a server.',
      flags: ['Ephemeral'],
    });
    return;
  }

  const game = gameManager.getGame(guildId);

  if (!game) {
    await interaction.reply({
      content: '📭 No active game in this server. Use `/whosthespy start` to begin one!',
      flags: ['Ephemeral'],
    });
    return;
  }

  await interaction.reply({ embeds: [statusEmbed(game)] });
}

// ─── Subcommand: end ────────────────────────────────────────────────────────

/**
 * Handle `/whosthespy end`.
 *
 * Force-ends the current game. Only the game host or users with the
 * `ManageGuild` permission are allowed to do this.
 */
async function handleEnd(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: '❌ This command can only be used in a server.',
      flags: ['Ephemeral'],
    });
    return;
  }

  const game = gameManager.getGame(guildId);

  if (!game) {
    await interaction.reply({
      content: '📭 No active game to end.',
      flags: ['Ephemeral'],
    });
    return;
  }

  // Permission check: only the host or someone with ManageGuild can end
  const isHost = interaction.user.id === game.hostId;
  const hasPermission =
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;

  if (!isHost && !hasPermission) {
    await interaction.reply({
      content:
        '❌ Only the game host or a server manager can end the game.',
      flags: ['Ephemeral'],
    });
    return;
  }

  // Signal all running phase loops to stop
  game.forceEnded = true;

  // Clean up the game state
  gameManager.endGame(guildId);

  await interaction.reply({
    content: '🛑 **The game has been force-ended.** Thanks for playing!',
  });
}
