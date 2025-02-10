import {
    CommandInteraction,
    SlashCommandBuilder,
    CommandInteractionOptionResolver
} from "discord.js";
import { Logger } from "../utils/logger";
import { Structure } from "../database/dbTypes";
import { TownDatabase } from "../database/db";

export const AddStructureCommand = {
    data: new SlashCommandBuilder()
        .setName("add_structure")
        .setDescription("Adds a new structure to the town")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("The name of the structure")
                .setRequired(true)
        ),

    execute: async (interaction: CommandInteraction, db: TownDatabase) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
            return;
        }

        const options = interaction.options as CommandInteractionOptionResolver;
        const structureName = options.getString("name");
        if (!structureName) {
            await interaction.reply({ content: "❌ Please provide a structure name.", ephemeral: true });
            return;
        }

        try {
            // Add structure to the database
            await db.addStructure(guildId, structureName);
            await db.logHistory(
                guildId,
                "structure_added",
                `🏗️ Added structure: **${structureName}**`,
                interaction.user.username
            );

            // Log in console
            Logger.logInfo(`🏗️ Structure added: ${structureName} by ${interaction.user.tag} in ${guildId}`);

            await interaction.reply(`✅ Structure **${structureName}** added successfully!`);
        } catch (error) {
            await Logger.handleError(interaction, "addStructure", error, "❌ Failed to add structure.");
        }
    }
};

export const ListStructuresCommand = {
    data: new SlashCommandBuilder()
        .setName("structures")
        .setDescription("Lists all structures in the town"),

    execute: async (interaction: CommandInteraction, db: TownDatabase) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
            return;
        }

        try {
            const structures = await db.getStructures(guildId);

            if (!structures || structures.length === 0) {
                await interaction.reply("📭 No structures found.");
                return;
            }

            const structureList = structures
                .map((s: Structure) => `🏗️ ${s.name} (Level ${s.level}) - Category: ${s.category}`)
                .join("\n");

            // Log in console
            Logger.logInfo(`📋 Listed structures for ${interaction.user.tag} in ${guildId}`);

            await interaction.reply(`📋 **Structures List:**\n${structureList}`);
        } catch (error) {
            await Logger.handleError(interaction, "listStructures", error, "❌ Failed getting structures.");
        }
    }
};
