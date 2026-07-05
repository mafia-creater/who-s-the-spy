import { TextChannel, ComponentType } from 'discord.js';
import type { GameState, Player } from '../types.js';
import { GamePhase } from '../types.js';
import { ID, Actions, MIN_PLAYERS, MAX_PLAYERS } from '../config.js';
import { gameManager } from '../game/GameManager.js';
import { lobbyEmbed } from '../ui/embeds.js';
import { lobbyButtons, settingsButtons } from '../ui/buttons.js';
import { editSettingsModal } from '../ui/modals.js';

// ─── Lobby Phase ─────────────────────────────────────────────────────────────

/**
 * Run the lobby phase of the game.
 *
 * Posts the lobby embed with interactive buttons and waits for the host to
 * start the game. Players can join/leave, and the host can toggle settings.
 *
 * @param game    - The current game state (must be in Lobby phase).
 * @param channel - The text channel to post the lobby embed in.
 * @returns `true` if the host started the game, `false` if the lobby was
 *          cancelled (e.g. idle timeout).
 */
export async function runLobbyPhase(
  game: GameState,
  channel: TextChannel,
): Promise<boolean> {
  const { guildId, hostId } = game;

  // Resolve the host's display name for the embed
  const hostPlayer = game.players.get(hostId);
  const hostName = hostPlayer?.displayName ?? 'Unknown';

  // ── Send the initial lobby message ──────────────────────────────────────
  const lobbyMsg = await channel.send({
    embeds: [lobbyEmbed(game.players, game.settings, hostName)],
    components: [
      lobbyButtons(guildId),
      settingsButtons(guildId, game.settings.mrWhiteEnabled),
    ],
  });

  game.lobbyMessageId = lobbyMsg.id;

  // ── Promise that resolves when the lobby ends ──────────────────────────
  return new Promise<boolean>((resolve) => {
    let started = false;

    const collector = lobbyMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      idle: 300_000, // 5-minute idle timeout
      filter: (i) => {
        const parsed = ID.parse(i.customId);
        if (!parsed || parsed.guildId !== guildId) return false;
        return ([Actions.Join, Actions.Leave, Actions.Start, Actions.ToggleMrWhite, Actions.EditSettings] as string[])
          .includes(parsed.action);
      },
    });

    collector.on('collect', async (interaction) => {
      // Parse custom ID
      const parsed = ID.parse(interaction.customId);
      if (!parsed) return;

      try {
        switch (parsed.action) {
          // ── Join ──────────────────────────────────────────────────────
          case Actions.Join: {
            const userId = interaction.user.id;

            if (game.players.has(userId)) {
              await interaction.reply({
                content: '⚠️ You are already in the game!',
                flags: ['Ephemeral'],
              });
              return;
            }

            if (game.players.size >= MAX_PLAYERS) {
              await interaction.reply({
                content: `⚠️ The lobby is full! Maximum **${MAX_PLAYERS}** players.`,
                flags: ['Ephemeral'],
              });
              return;
            }

            const player: Player = {
              userId,
              username: interaction.user.username,
              displayName: interaction.member && 'displayName' in interaction.member
                ? (interaction.member.displayName as string)
                : interaction.user.displayName,
              isAlive: true,
              hasGivenClue: false,
              dmFailed: false,
            };

            game.players.set(userId, player);

            await interaction.deferUpdate();
            await lobbyMsg.edit({
              embeds: [lobbyEmbed(game.players, game.settings, hostName)],
            });
            break;
          }

          // ── Leave ────────────────────────────────────────────────────
          case Actions.Leave: {
            const userId = interaction.user.id;

            if (!game.players.has(userId)) {
              await interaction.reply({
                content: '⚠️ You are not in the game!',
                flags: ['Ephemeral'],
              });
              return;
            }

            if (userId === hostId) {
              await interaction.reply({
                content: '⚠️ The host cannot leave! Use `/whosthespy end` to cancel the game.',
                flags: ['Ephemeral'],
              });
              return;
            }

            game.players.delete(userId);

            await interaction.deferUpdate();
            await lobbyMsg.edit({
              embeds: [lobbyEmbed(game.players, game.settings, hostName)],
            });
            break;
          }

          // ── Toggle Mr. White ─────────────────────────────────────────
          case Actions.ToggleMrWhite: {
            if (interaction.user.id !== hostId) {
              await interaction.reply({
                content: '⚠️ Only the host can change settings!',
                flags: ['Ephemeral'],
              });
              return;
            }

            game.settings.mrWhiteEnabled = !game.settings.mrWhiteEnabled;

            await interaction.deferUpdate();
            await lobbyMsg.edit({
              embeds: [lobbyEmbed(game.players, game.settings, hostName)],
              components: [
                lobbyButtons(guildId),
                settingsButtons(guildId, game.settings.mrWhiteEnabled),
              ],
            });
            break;
          }

          // ── Edit Settings ────────────────────────────────────────────
          case Actions.EditSettings: {
            if (interaction.user.id !== hostId) {
              await interaction.reply({
                content: '⚠️ Only the host can change settings!',
                flags: ['Ephemeral'],
              });
              return;
            }

            await interaction.showModal(editSettingsModal(game.settings, guildId));

            try {
              console.log('[EditSettings] Awaiting modal submit...');
              const modalSubmit = await interaction.awaitModalSubmit({
                time: 300_000,
                filter: (i) =>
                  i.customId === ID.make(Actions.EditSettingsModal, guildId) &&
                  i.user.id === hostId,
              });
              console.log('[EditSettings] Modal submitted!');

              const clueStr = modalSubmit.fields.getTextInputValue('clueTimer');
              const discStr = modalSubmit.fields.getTextInputValue('discussionTimer');
              const voteStr = modalSubmit.fields.getTextInputValue('voteTimer');

              const clueVal = parseInt(clueStr, 10);
              const discVal = parseInt(discStr, 10);
              const voteVal = parseInt(voteStr, 10);

              if (
                isNaN(clueVal) || clueVal < 10 || clueVal > 300 ||
                isNaN(discVal) || discVal < 10 || discVal > 300 ||
                isNaN(voteVal) || voteVal < 10 || voteVal > 300
              ) {
                await modalSubmit.reply({
                  content: '⚠️ Timers must be valid numbers between 10 and 300 seconds.',
                  flags: ['Ephemeral'],
                });
                return;
              }

              game.settings.clueTimerSeconds = clueVal;
              game.settings.discussionTimerSeconds = discVal;
              game.settings.voteTimerSeconds = voteVal;

              await modalSubmit.deferUpdate();
              await lobbyMsg.edit({
                embeds: [lobbyEmbed(game.players, game.settings, hostName)],
                components: [
                  lobbyButtons(guildId),
                  settingsButtons(guildId, game.settings.mrWhiteEnabled),
                ],
              });
            } catch (err) {
              // Modal timed out or failed, do nothing
            }
            break;
          }

          // ── Start ────────────────────────────────────────────────────
          case Actions.Start: {
            if (interaction.user.id !== hostId) {
              await interaction.reply({
                content: '⚠️ Only the host can start the game!',
                flags: ['Ephemeral'],
              });
              return;
            }

            if (game.players.size < MIN_PLAYERS) {
              await interaction.reply({
                content: `⚠️ Not enough players! Need at least **${MIN_PLAYERS}**, currently have **${game.players.size}**.`,
                flags: ['Ephemeral'],
              });
              return;
            }

            started = true;
            game.phase = GamePhase.RoleAssignment;

            await interaction.deferUpdate();
            // Remove buttons from the lobby message
            await lobbyMsg.edit({
              embeds: [lobbyEmbed(game.players, game.settings, hostName)],
              components: [],
            });

            collector.stop('started');
            break;
          }
        }
      } catch (error) {
        // Interaction may have expired or already been replied to
        console.error('[LobbyPhase] Interaction error:', error);
      }
    });

    collector.on('end', async (_collected, reason) => {
      if (started) {
        resolve(true);
        return;
      }

      // Lobby timed out or was ended for another reason — clean up
      try {
        await lobbyMsg.edit({
          embeds: [lobbyEmbed(game.players, game.settings, hostName)],
          components: [],
        });
        await channel.send('⏰ The lobby timed out due to inactivity. Game cancelled.');
      } catch {
        // Message may have been deleted
      }

      gameManager.endGame(guildId);
      resolve(false);
    });
  });
}
