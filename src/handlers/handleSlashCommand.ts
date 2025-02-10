import { CommandInteraction } from "discord.js";
import { CommandList } from "../commands/commandList";
import { TownDatabase } from "../database/db";
import { Logger } from "../utils/logger";

/**
 * Handles execution of Slash Commands.
 */
export const handleSlashCommand = async (interaction: CommandInteraction, db: TownDatabase) => {
    const command = CommandList.find(cmd => cmd.data.name === interaction.commandName);

    if (!command) {
        await interaction.reply({ content: "❌ Command not found.", ephemeral: true });
        return;
    }

    try {
        Logger.logInfo(`🛠️ Executing command: /${interaction.commandName} by ${interaction.user.tag}`);
        await command.execute(interaction, db);
    } catch (error) {
        await Logger.handleError(interaction, `handleSlashCommand - ${interaction.commandName}`, error, "❌ An error occurred while executing this command.");
    }
};
