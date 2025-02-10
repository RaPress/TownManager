import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { TownDatabase } from "../database/db";
import { HistoryLog } from "../database/dbTypes";
import { Logger } from "../utils/logger";

/**
 * Slash command to fetch and display the history of actions in the town.
 */
export const FetchHistoryCommand = {
    data: new SlashCommandBuilder()
        .setName("history")
        .setDescription("Fetches and displays the town's recent history."),

    execute: async (interaction: CommandInteraction, db: TownDatabase) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
            return;
        }

        try {
            const history: HistoryLog[] = await db.getHistory(guildId);

            if (!history || history.length === 0) {
                await interaction.reply("📜 No history available.");
                return;
            }

            const formattedHistory = history
                .map((h) => `📌 **${new Date(h.timestamp).toLocaleString()}** - ${h.action_type}: ${h.description}`)
                .join("\n");

            await interaction.reply(`📜 **Recent History:**\n${formattedHistory}`);

            await db.logHistory(
                guildId,
                "history_viewed",
                `📜 Checked the history log`,
                interaction.user.username
            );

            Logger.logInfo(`📜 History log viewed by ${interaction.user.tag} in ${guildId}`);
        } catch (error) {
            await Logger.handleError(interaction, "fetchHistory", error, "❌ Error fetching history.");
        }
    }
};
