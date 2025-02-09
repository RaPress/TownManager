import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";
import { Message, ButtonInteraction } from "discord.js";

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
        await db.logHistory(
            guildId,
            "vote_started", // Action Type
            `🗳️ Started a vote for: ${mentionedPlayers.map(id => `<@${id}>`).join(", ")}`, // Description
            message.author.username // User
        );


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
        await Logger.handleError(message, "startVoting", error, "❌ Error starting vote. Please try again.");
    }
}

/**
 * Handles a vote button click.
 */
export async function handleVote(interaction: ButtonInteraction, db: TownDatabase): Promise<void> {
    const voterId = interaction.user.id;
    const structureId = parseInt(interaction.customId.replace("vote_", ""), 10);
    const guildId = interaction.guildId;

    if (!guildId) {
        await interaction.reply("❌ Error: Unable to determine guild.");
        return;
    }

    try {
        // Get the latest adventure ID for this guild
        const adventureId = await db.getLatestAdventureId(guildId);

        if (!adventureId) {
            await interaction.reply("❌ No active adventure found for voting.");
            return;
        }

        // Record the vote
        await db.recordVote(voterId, structureId, adventureId, 1, guildId);

        await interaction.reply(`✅ Your vote has been recorded for <@${structureId}>!`);
    } catch (error) {
        await Logger.handleError(interaction.message, "handleVote", error, "❌ Error recording your vote.");
    }
}
