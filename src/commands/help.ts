import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Colors } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Learn how to play Who\'s the Spy!');

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(Colors.Lobby)
    .setTitle('📖 How to Play: Who\'s the Spy')
    .setDescription(
      '**Who\'s the Spy** is a social deduction game of words, bluffing, and subtle clues!\n\n' +
      '### 🎯 The Goal\n' +
      '- **Civilians:** Figure out who the Spy (and Mr. White) is and vote them out.\n' +
      '- **The Spy:** Blend in with the Civilians and survive until the end.\n' +
      '- **Mr. White:** You have no word! Figure out the Civilian word and survive. If you are voted out, you get one chance to guess the word and steal the win!\n\n' +
      '### 📝 The Rules\n' +
      '1️⃣ **Role Assignment:** Everyone is secretly given a word (except Mr. White). Civilians get the same word, the Spy gets a similar word.\n' +
      '2️⃣ **Give Clues:** Take turns giving a short, one-word or phrase clue about your word. **Don\'t be too obvious**, or the Spy/Mr. White will figure it out! **Don\'t be too vague**, or you will look like the Spy!\n' +
      '3️⃣ **Discussion:** Once everyone has given a clue, discuss who sounded the most suspicious.\n' +
      '4️⃣ **Vote:** Vote to eliminate a player. The game continues until all impostors are eliminated or they outnumber the Civilians.\n\n' +
      '### 💻 Commands\n' +
      '`/whosthespy start` — Start a new game in this channel.\n' +
      '`/whosthespy status` — Check the status of a running game.\n' +
      '`/whosthespy end` — Force end the current game.'
    )
    .setFooter({ text: 'Good luck, and trust no one! 🕵️‍♂️' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
