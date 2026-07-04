import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Load .env File ──────────────────────────────────────────────────────────
// Must run before any config imports so process.env is populated.

try {
  const envPath = resolve(process.cwd(), '.env');
  const envFile = readFileSync(envPath, 'utf-8');

  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
  }
} catch {
  // .env file not found — use existing environment variables
}

// ─── Imports (after env loading) ─────────────────────────────────────────────

import { Client, GatewayIntentBits, Events } from 'discord.js';
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

    // ── Expired Button / Modal Catch-All ─────────────────────────────────
    // Button and modal interactions for active games are handled by
    // component collectors in the phase files. If an interaction with the
    // 'wts:' prefix reaches here, it means the collector has already ended
    // (the phase timed out or the game ended).
    if (interaction.isButton() || interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('wts:')) {
        // Guard: only reply if we haven't already
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '⏰ This interaction has expired. The game may have moved on or ended.',
            ephemeral: true,
          });
        }
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
          ephemeral: true,
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
