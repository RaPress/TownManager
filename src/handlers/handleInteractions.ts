import { Client, Interaction } from "discord.js";
import { Logger } from "../utils/logger";

export function handleInteractions(bot: Client) {
    bot.on("interactionCreate", async (interaction: Interaction) => {
        try {
            if (!interaction.guild) {
                Logger.logInfo("⚠ Interaction received outside of a server.");
                return;
            }

            const guildId = interaction.guild.id;
            Logger.logInfo(`🔹 Interaction received from ${interaction.user.tag} (Server: ${guildId})`);

            // Handle Slash Commands (Future-proofing)
            if (interaction.isCommand()) {
                await interaction.reply("❌ Slash commands are not implemented yet.");
                return;
            }

            // Handle Buttons
            if (interaction.isButton()) {
                Logger.logInfo(`🔘 Button clicked: ${interaction.customId}`);
                return; // Buttons are handled in `handleButtons.ts`
            }
        } catch (error) {
            Logger.handleError(null, "handleInteractions", error, "❌ Error handling interaction.");
        }
    });
}
