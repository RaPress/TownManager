import { Message, ButtonInteraction } from "discord.js";
import { TownDatabase } from "../database/db";

/**
 * Starts a voting session for mentioned players.
 */
export async function startVoting(message: Message, mentionedPlayers: string[], db: TownDatabase, guildId: string): Promise<void> {
    if (mentionedPlayers.length === 0) {
        await message.reply("❌ You must mention players who will participate in the vote.");
        return;
    }

    try {
        await db.startVoteSession(guildId, mentionedPlayers);
        await db.logHistory(guildId, `🗳️ **${message.author.username}** started a vote for: ${mentionedPlayers.map(id => `<@${id}>`).join(", ")}`);

        const voteButtons = mentionedPlayers.map((id) => ({
            type: 2,
            label: `<@${id}>`,
            customId: `vote_${id}`,
            style: 1,
        }));

        await message.reply({
            content: "🗳️ Voting has started! Click a button to cast your vote.",
            components: [{ type: 1, components: voteButtons }],
        });
    } catch (error) {
        console.error("Error starting vote:", error);
        await message.reply("❌ Error starting vote. Please try again.");
    }
}

/**
 * Handles a vote button click.
 */
export async function handleVote(interaction: ButtonInteraction, db: TownDatabase): Promise<void> {
    const voterId = interaction.user.id;
    const votedFor = interaction.customId.replace("vote_", "");

    try {
        await db.recordVote(voterId, votedFor);
        await interaction.reply(`✅ Your vote has been recorded for <@${votedFor}>!`);
    } catch (error) {
        console.error("Error handling vote:", error);
        await interaction.reply("❌ Error recording your vote.");
    }
}
