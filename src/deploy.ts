import './env.js';
import { REST, Routes } from 'discord.js';
import { data as whosthespyData } from './commands/whosthespy.js';
import { data as helpData } from './commands/help.js';

// ─── Read Config ─────────────────────────────────────────────────────────────
// Import config *after* loading .env so the env vars are available.

const DISCORD_TOKEN = process.env.DISCORD_TOKEN ?? '';
const CLIENT_ID = process.env.CLIENT_ID ?? '';
const GUILD_ID = process.env.GUILD_ID ?? '';

// ─── Validate ────────────────────────────────────────────────────────────────

if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is not set. Check your .env file.');
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error('❌ CLIENT_ID is not set. Check your .env file.');
  process.exit(1);
}

// ─── Deploy Commands ─────────────────────────────────────────────────────────

const commands = [whosthespyData.toJSON(), helpData.toJSON()];
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function deploy(): Promise<void> {
  try {
    console.log(`🔄 Registering ${commands.length} slash command(s)…`);

    if (GUILD_ID) {
      // Guild commands update instantly — ideal for development
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands },
      );
      console.log(`✅ Successfully registered guild commands for guild ${GUILD_ID}.`);
    } else {
      // Global commands can take up to 1 hour to propagate
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands },
      );
      console.log('✅ Successfully registered global commands (may take up to 1 hour to propagate).');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to register commands: ${message}`);
    process.exit(1);
  }
}

deploy();
