import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";
import { Message, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

/**
 * Requests upgrade confirmation.
 */
export async function requestUpgradeConfirmation(
    message: Message,
    options: Record<string, string>,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    const structureName = options.name;

    if (!structureName) {
        await message.reply("❌ Please provide a structure name using `name=<structureName>`.");
        return;
    }

    try {
        await message.reply({
            content: `⚙️ Are you sure you want to upgrade **${structureName}**?`,
            components: [createUpgradeButtons(guildId, structureName)]
        });
    } catch (error) {
        await Logger.handleError(message, "requestUpgradeConfirmation", error, "❌ Error requesting upgrade.");
    }
}

/**
 * Handles upgrade confirmation or cancellation.
 */
export async function handleUpgradeInteraction(
    interaction: ButtonInteraction,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    const { customId, user } = interaction;
    const [action, structureName] = customId.split("_").slice(1); // Extract action and structure name

    if (!structureName) {
        await interaction.reply({ content: "❌ Error: Structure name missing in button ID.", ephemeral: true });
        return;
    }

    try {
        const logAction = action === "confirm" ? "upgrade_confirmed" : "upgrade_canceled";
        const logMessage = action === "confirm"
            ? `⚙️ Confirmed upgrade for **${structureName}**`
            : `❌ Canceled upgrade for **${structureName}**`;

        await db.logHistory(guildId, logAction, logMessage, user.username);
        await interaction.reply({ content: logMessage, ephemeral: false });
    } catch (error) {
        await Logger.handleError(interaction.message, "handleUpgradeInteraction", error, "❌ Error handling upgrade action.");
    }
}

/**
 * Creates upgrade confirmation buttons.
 */
function createUpgradeButtons(guildId: string, structureName: string) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`confirm_${structureName}_${guildId}`)
            .setLabel("✅ Confirm")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId(`cancel_${structureName}_${guildId}`)
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger)
    );
}
