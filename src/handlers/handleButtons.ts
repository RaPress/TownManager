import { Client, Interaction, ButtonInteraction } from "discord.js";
import { TownDatabase } from "../database/db";
import { handleVote } from "../commands/voting";
import { handleUpgradeInteraction } from "../commands/upgrade";

export function handleButtons(bot: Client, db: TownDatabase) {
    bot.on("interactionCreate", async (interaction: Interaction) => {
        if (!interaction.isButton()) return;

        console.log(`🔹 Button clicked: ${interaction.customId} by ${interaction.user.tag}`);

        if (interaction.customId.startsWith("vote_")) {
            await handleVote(interaction as ButtonInteraction, db);
        } else if (
            interaction.customId.startsWith("confirm_upgrade_") ||
            interaction.customId.startsWith("cancel_upgrade_")
        ) {
            const extractedGuildId = interaction.customId.split("_")[3] || "dm";
            await handleUpgradeInteraction(interaction as ButtonInteraction, db, extractedGuildId);
        }
    });
}
