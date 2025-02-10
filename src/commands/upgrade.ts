import {
    ButtonStyle,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonInteraction,
    CommandInteraction,
    SlashCommandBuilder,
    CommandInteractionOptionResolver
} from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Slash command to request an upgrade confirmation.
 */
export const RequestUpgradeCommand = {
    data: new SlashCommandBuilder()
        .setName("upgrade")
        .setDescription("Request to upgrade a structure.")
        .addStringOption(option =>
            option.setName("structure")
                .setDescription("The name of the structure to upgrade")
                .setRequired(true)
        ),

    execute: async (interaction: CommandInteraction) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
            return;
        }

        const options = interaction.options as CommandInteractionOptionResolver;
        const structureName = options.getString("structure");
        if (!structureName) {
            await interaction.reply({ content: "❌ Please provide a structure name.", ephemeral: true });
            return;
        }

        try {
            // Create confirmation buttons
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirm_upgrade_${guildId}`)
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`cancel_upgrade_${guildId}`)
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Danger)
            );

            Logger.logInfo(`⚙️ Upgrade request initiated for ${structureName} by ${interaction.user.tag} in ${guildId}`);

            await interaction.reply({
                content: `⚙️ Are you sure you want to upgrade **${structureName}**?`,
                components: [row]
            });
        } catch (error) {
            await Logger.handleError(interaction, "requestUpgradeConfirmation", error, "❌ Error requesting upgrade.");
        }
    }
};

/**
 * Handles upgrade confirmation or cancellation.
 */
export async function handleUpgradeInteraction(interaction: ButtonInteraction, db: TownDatabase, guildId: string): Promise<void> {
    const { customId, user } = interaction;

    try {
        if (customId.startsWith("confirm_upgrade_")) {
            await db.logHistory(
                guildId,
                "upgrade_confirmed",
                `⚙️ Upgrade confirmed!`,
                user.username
            );

            Logger.logInfo(`✅ Upgrade confirmed by ${user.tag} in ${guildId}`);

            await interaction.reply(`✅ Upgrade confirmed by ${user.username}!`);
        } else if (customId.startsWith("cancel_upgrade_")) {
            await db.logHistory(
                guildId,
                "upgrade_canceled",
                `❌ Upgrade canceled.`,
                user.username
            );

            Logger.logInfo(`❌ Upgrade canceled by ${user.tag} in ${guildId}`);

            await interaction.reply(`❌ Upgrade canceled by ${user.username}.`);
        } else {
            await interaction.reply({ content: "❌ Invalid upgrade action.", ephemeral: true });
        }
    } catch (error) {
        await Logger.handleError(interaction, "handleUpgradeInteraction", error, "❌ Error handling upgrade action.");
    }
}
