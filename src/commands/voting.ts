import { SlashCommandBuilder, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, CommandInteractionOptionResolver } from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Starts a voting session for selected players.
 */
export const StartVotingCommand = {
    data: new SlashCommandBuilder()
        .setName("start_voting")
        .setDescription("Starts a voting session for selected players.")
        .addStringOption(option =>
            option.setName("players")
                .setDescription("Mention players who will participate in the vote (separate with spaces)")
                .setRequired(true)
        ),

    execute: async (interaction: CommandInteraction, db: TownDatabase) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
            return;
        }

        // 🔹 Fix: Ensure correct type inference for options
        const options = interaction.options as CommandInteractionOptionResolver;
        const playersInput = options.getString("players", true);

        // 🔹 Fix: Extract mentioned users dynamically
        const mentionedPlayers = playersInput.match(/<@!?(\d+)>/g)?.map(id => id.replace(/[<@!>]/g, "")) || [];

        if (mentionedPlayers.length === 0) {
            await interaction.reply({ content: "❌ You must mention at least one player.", ephemeral: true });
            return;
        }

        try {
            // Start voting session in the database
            await db.startVoteSession(guildId, mentionedPlayers);
            await db.logHistory(
                guildId,
                "vote_started",
                `🗳️ Started a vote for: ${mentionedPlayers.map(id => `<@${id}>`).join(", ")}`,
                interaction.user.username
            );

            // 🔹 Fix: Create vote buttons dynamically
            const voteButtons = mentionedPlayers.map(id =>
                new ButtonBuilder()
                    .setCustomId(`vote_${id}`)
                    .setLabel(`Vote for <@${id}>`)
                    .setStyle(ButtonStyle.Primary)
            );

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(voteButtons);

            Logger.logInfo(`🗳️ Voting started by ${interaction.user.tag} in ${guildId} for: ${mentionedPlayers.join(", ")}`);

            await interaction.reply({
                content: "🗳️ Voting has started! Click a button to cast your vote.",
                components: [row]
            });
        } catch (error) {
            await Logger.handleError(interaction, "startVoting", error, "❌ Error starting vote. Please try again.");
        }
    }
};

/**
 * Handles a vote button click.
 */
export async function handleVote(interaction: ButtonInteraction, db: TownDatabase): Promise<void> {
    const voterId = interaction.user.id;
    const structureIdStr = interaction.customId.replace("vote_", "");
    const guildId = interaction.guildId;

    if (!guildId) {
        await interaction.reply({ content: "❌ Error: Unable to determine guild.", ephemeral: true });
        return;
    }

    // 🔹 Fix: Convert structureId to a number
    const structureId = parseInt(structureIdStr, 10);
    if (isNaN(structureId)) {
        await interaction.reply({ content: "❌ Invalid vote target.", ephemeral: true });
        return;
    }

    try {
        // Get the latest adventure ID for this guild
        const adventureId = await db.getLatestAdventureId(guildId);

        if (!adventureId) {
            await interaction.reply({ content: "❌ No active adventure found for voting.", ephemeral: true });
            return;
        }

        // Record the vote
        await db.recordVote(voterId, structureId, adventureId, 1, guildId);

        Logger.logInfo(`✅ ${interaction.user.tag} voted for ${structureId} in guild ${guildId}.`);

        await interaction.reply({ content: `✅ Your vote has been recorded for <@${structureId}>!`, ephemeral: true });
    } catch (error) {
        await Logger.handleError(interaction, "handleVote", error, "❌ Error recording your vote.");
    }
}
