import { DiscordAPIError, User, EmbedBuilder } from 'discord.js';
import type { DMResult } from '../types.js';

/**
 * Safely send a Direct Message to a Discord user.
 *
 * Catches common failures — most notably Discord API error **50007**
 * ("Cannot send messages to this user") — and returns a typed
 * {@link DMResult} instead of throwing.
 *
 * @param user    - The target Discord user.
 * @param content - Either a plain string or an object with an `embeds` array.
 * @returns A {@link DMResult} indicating success/failure and the user's ID.
 *
 * @example
 * ```ts
 * const result = await safeDM(user, { embeds: [roleEmbed] });
 * if (!result.success) {
 *   console.warn(`Could not DM ${user.tag}`);
 * }
 * ```
 */
export async function safeDM(
  user: User,
  content: string | { embeds: EmbedBuilder[] },
): Promise<DMResult> {
  try {
    if (typeof content === 'string') {
      await user.send({ content });
    } else {
      await user.send({ embeds: content.embeds });
    }

    return { success: true, userId: user.id };
  } catch (error: unknown) {
    // ── Handle known "cannot DM this user" error ──────────────────────────
    if (error instanceof DiscordAPIError && error.code === 50007) {
      console.warn(
        `[dmSender] Cannot send DM to ${user.tag} (${user.id}) — user has DMs disabled.`,
      );
      return { success: false, userId: user.id };
    }

    // ── Handle any other unexpected error ─────────────────────────────────
    const message =
      error instanceof Error ? error.message : String(error);
    console.warn(
      `[dmSender] Failed to DM ${user.tag} (${user.id}): ${message}`,
    );

    return { success: false, userId: user.id };
  }
}
