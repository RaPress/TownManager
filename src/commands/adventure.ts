import { SlashCommandBuilder, CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Slash command to end an adventure and start a voting session.
 */
export const EndAdventureCommand = {
    data: new SlashCommandBuilder()
        .setName("end_adventure")
        .setDescription("Ends an adventure and starts a voting session.")
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

        // 🔹 Ensure correct type inference for options
        const options = interaction.options as CommandInteractionOptionResolver;
        const playersInput = options.getString("players", true);

        // Extract mentioned users
        const mentionedPlayers = playersInput.match(/<@!?(\d+)>/g)?.map(id => id.replace(/[<@!>]/g, "")) || [];

        if (mentionedPlayers.length === 0) {
            await interaction.reply({ content: "❌ You must mention at least one player.", ephemeral: true });
            return;
        }

        try {
            await db.logHistory(
                guildId,
                "adventure_ended",
                `⚔️ Ended an adventure with participants: ${mentionedPlayers.map(id => `<@${id}>`).join(", ")}`,
                interaction.user.username
            );

            Logger.logInfo(`⚔️ Adventure ended by ${interaction.user.tag} in ${guildId} with players: ${mentionedPlayers.join(", ")}`);

            await interaction.reply(`🏆 The adventure has ended! A voting session will now begin for: ${mentionedPlayers.map(id => `<@${id}>`).join(", ")}`);
        } catch (error) {
            await Logger.handleError(interaction, "endAdventure", error, "❌ Error ending adventure.");
        }
    }
};
