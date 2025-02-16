import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";
import { Message, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

/**
 * Starts a voting session for mentioned players.
 */
export async function startVoting(
    message: Message,
    options: Record<string, string>,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    const mentionedPlayers = message.mentions.users.map(user => user.id);

    if (!mentionedPlayers.length) {
        await message.reply("❌ You must mention players who will participate in the vote.");
        return;
    }

    try {
        await db.startVoteSession(guildId, mentionedPlayers);
        await db.logHistory(
            guildId,
            "vote_started",
            `🗳️ Started a vote for: ${mentionedPlayers.map(id => `<@${id}>`).join(", ")}`,
            message.author.username
        );

        await message.reply({
            content: "🗳️ Voting has started! Click a button to cast your vote.",
            components: [createVoteButtons(mentionedPlayers)]
        });
    } catch (error) {
        await Logger.handleError(message, "startVoting", error, "❌ Error starting vote. Please try again.");
    }
}

/**
 * Handles a vote button click.
 */
export async function handleVote(
    interaction: ButtonInteraction,
    db: TownDatabase
): Promise<void> {
    const voterId = interaction.user.id;
    const structureId = parseInt(interaction.customId.replace("vote_", ""), 10);
    const guildId = interaction.guildId;

    if (!guildId) {
        await interaction.reply({ content: "❌ Error: Unable to determine guild.", ephemeral: true });
        return;
    }

    try {
        const adventureId = await db.getLatestAdventureId(guildId);
        if (!adventureId) {
            await interaction.reply({ content: "❌ No active adventure found for voting.", ephemeral: true });
            return;
        }

        await db.recordVote(voterId, structureId, adventureId, 1, guildId);
        await interaction.reply({ content: `✅ Your vote has been recorded for <@${structureId}>!`, ephemeral: true });

    } catch (error) {
        await Logger.handleError(interaction.message, "handleVote", error, "❌ Error recording your vote.");
    }
}

/**
 * Creates voting buttons for mentioned players.
 */
function createVoteButtons(playerIds: string[]): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        playerIds.map(id =>
            new ButtonBuilder()
                .setCustomId(`vote_${id}`)
                .setLabel(`Vote for <@${id}>`)
                .setStyle(ButtonStyle.Primary)
        )
    );
}
