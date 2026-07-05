import './env.js';

// ─── Imports (after env loading) ─────────────────────────────────────────────

import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';
import { DISCORD_TOKEN } from './config.js';
import { execute } from './commands/whosthespy.js';

// ─── Client Setup ────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

// ─── Ready Event ─────────────────────────────────────────────────────────────

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  
  readyClient.user.setPresence({
    activities: [{ 
      name: 'Who\'s the Spy | /whosthespy start', 
      type: ActivityType.Playing 
    }],
    status: 'online',
  });
});

// ─── Interaction Handling ────────────────────────────────────────────────────

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // ── Slash Commands ────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'whosthespy') {
        await execute(interaction);
      }
      return;
    }


  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[index] Interaction handler error: ${message}`);

    // Attempt to notify the user
    try {
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Something went wrong processing that interaction.',
          flags: ['Ephemeral'],
        });
      }
    } catch {
      // Reply failed — nothing we can do
    }
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────

if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is not set. Check your .env file.');
  process.exit(1);
}

client.login(DISCORD_TOKEN);

// ─── Global Error Handlers ──────────────────────────────────────────────────
// Prevent the bot from crashing on unhandled errors. Log them instead.

process.on('unhandledRejection', (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[UNHANDLED REJECTION] ${message}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
});

process.on('uncaughtException', (error: Error) => {
  console.error(`[UNCAUGHT EXCEPTION] ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
  }
  // Don't exit — let the bot continue running
});
