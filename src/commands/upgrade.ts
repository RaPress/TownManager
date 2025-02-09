import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";
import { Message, ButtonInteraction } from "discord.js";

export async function requestUpgradeConfirmation(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    if (args.length === 0) {
        await message.reply("❌ Please provide a structure name.");
        return;
    }

    const structureName = args.join(" ");

    try {
        await message.reply({
            content: `⚙️ Are you sure you want to upgrade **${structureName}**?`,
            components: [
                {
                    type: 1,
                    components: [
                        { type: 2, label: "Confirm", customId: `confirm_upgrade_${guildId}`, style: 1 },
                        { type: 2, label: "Cancel", customId: `cancel_upgrade_${guildId}`, style: 4 },
                    ],
                },
            ],
        });
    } catch (error) {
        await Logger.handleError(message, "requestUpgradeConfirmation", error, "❌ Error requesting upgrade.");
    }
}

export async function handleUpgradeInteraction(interaction: ButtonInteraction, db: TownDatabase, guildId: string): Promise<void> {
    const { customId, user } = interaction;

    if (customId.startsWith("confirm_upgrade_")) {
        await db.logHistory(
            guildId,
            "upgrade_confirmed",
            `⚙️ Confirmed an upgrade!`,
            user.username
        );
        await interaction.reply(`✅ Upgrade confirmed by ${user.username}!`);
    } else if (customId.startsWith("cancel_upgrade_")) {
        await db.logHistory(
            guildId,
            "upgrade_canceled",
            `❌ Canceled an upgrade.`,
            user.username
        );
        await interaction.reply(`❌ Upgrade canceled by ${user.username}.`);
    }

}
