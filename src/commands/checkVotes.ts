import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { Vote } from "../database/dbTypes";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Slash command to check and display the current votes.
 */
export const CheckVotesCommand = {
    data: new SlashCommandBuilder()
        .setName("check_votes")
        .setDescription("Checks and displays the current votes for structures."),

    execute: async (interaction: CommandInteraction, db: TownDatabase) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
            return;
        }

        try {
            const votes: Vote[] = await db.getVotes(guildId);

            if (!votes || votes.length === 0) {
                await interaction.reply("🗳️ No votes have been cast yet.");
                return;
            }

            const voteCounts: Record<string, number> = {};
            votes.forEach((vote) => {
                voteCounts[vote.structure_id] = (voteCounts[vote.structure_id] || 0) + 1;
            });

            const results = Object.entries(voteCounts)
                .map(([structureId, count]) => `🏗️ Structure ID **${structureId}**: **${count} votes**`)
                .join("\n");

            await db.logHistory(
                guildId,
                "vote_results_checked",
                `📊 Checked vote results`,
                interaction.user.username
            );

            Logger.logInfo(`📊 Vote results checked by ${interaction.user.tag} in ${guildId}`);

            await interaction.reply(`📊 **Voting Results:**\n${results}`);
        } catch (error) {
            await Logger.handleError(interaction, "checkVotes", error, "❌ Error checking votes.");
        }
    }
};
