import {
    Message,
    ButtonInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Initiates the structure creation confirmation process.
 */
export async function addStructure(
    message: Message,
    options: Record<string, string>,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    const structureName = options["name"];
    const category = options["category"] || options["cat"] || "General";

    if (!structureName) {
        await message.reply("❌ Structure name cannot be empty.");
        return;
    }

    // ✅ Create a preview embed
    const embed = new EmbedBuilder()
        .setTitle("⚠️ Confirm New Structure")
        .setDescription(`Are you sure you want to create the following structure?\n\n**Name:** ${structureName}\n**Category:** ${category}`)
        .setColor(0xf1c40f);

    // ✅ Add confirmation buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`confirm_add_${guildId}_${structureName}_${category}`).setLabel("✅ Confirm").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`cancel_add_${guildId}`).setLabel("❌ Cancel").setStyle(ButtonStyle.Danger)
    );

    await message.reply({ embeds: [embed], components: [row] });
}

/**
 * Handles the confirmation interaction for adding a structure.
 */
export async function handleAddStructureInteraction(interaction: ButtonInteraction, db: TownDatabase): Promise<void> {
    if (!interaction.customId.startsWith("confirm_add_") && !interaction.customId.startsWith("cancel_add_")) return;

    const [, action, guildId, structureName, category] = interaction.customId.split("_");

    if (action === "add") {
        try {
            await db.addStructure(guildId, structureName, category);
            await db.logHistory(
                guildId,
                "structure_added",
                `🏗️ Added structure: **${structureName}** (Category: ${category})`,
                interaction.user.username
            );

            await interaction.update({ content: `✅ Structure **${structureName}** successfully added in category **${category}**!`, components: [] });
        } catch (error) {
            await Logger.handleError(interaction.message, "handleAddStructureInteraction", error, "❌ Failed to add structure.");
        }
    } else {
        await interaction.update({ content: "❌ Structure addition **canceled**.", components: [] });
    }
}

/**
 * Lists all structures in the town.
 */
export async function listStructures(
    message: Message,
    options: Record<string, string>,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    try {
        const categoryFilter = options["category"] || null;
        const structures = await db.getStructures(guildId);

        if (!structures.length) {
            await message.reply("📭 No structures found.");
            return;
        }

        // If a category filter exists, apply it; otherwise, use all structures
        const filteredStructures = categoryFilter
            ? structures.filter(s => s.category.toLowerCase() === categoryFilter.toLowerCase())
            : structures;

        if (!filteredStructures.length) {
            await message.reply(`📭 No structures found in category **${categoryFilter}**.`);
            return;
        }

        const structureList = filteredStructures
            .map(s => `🏗️ **${s.name}** (Level ${s.level}) - Category: **${s.category}**`)
            .join("\n");

        await message.reply(`📋 **Structures List:**\n${structureList}`);
    } catch (error) {
        await Logger.handleError(message, "listStructures", error, "❌ Failed getting structures.");
    }
}

/**
 * Removes an existing structure.
 */
export async function removeStructure(
    message: Message,
    options: Record<string, string>,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    const structureName = options["name"];

    if (!structureName) {
        await message.reply("❌ Please provide a structure name.");
        return;
    }

    try {
        const deleted = await db.removeStructure(guildId, structureName);
        if (!deleted) {
            await message.reply(`⚠ Structure **${structureName}** not found.`);
            return;
        }

        await db.logHistory(
            guildId,
            "structure_removed",
            `🛑 Removed structure: **${structureName}**`,
            message.author.username
        );

        await message.reply(`✅ Structure **${structureName}** removed successfully!`);
    } catch (error) {
        await Logger.handleError(message, "removeStructure", error, "❌ Failed to remove structure.");
    }
}

/**
 * Updates a structure's category.
 */
export async function updateStructure(
    message: Message,
    options: Record<string, string>,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    const structureName = options["name"];
    const newCategory = options["category"] || options["cat"];
    const newName = options["newName"];

    if (!structureName || (!newCategory && !newName)) {
        await message.reply("❌ You must provide a structure name and a new category or a new name.");
        return;
    }

    const structure = await db.getStructureByName(guildId, structureName);
    if (!structure) {
        await message.reply(`❌ Structure **${structureName}** not found.`);
        return;
    }

    const updatedName = newName || structure.name;
    const updatedCategory = newCategory || structure.category;

    // ✅ Create a preview embed
    const embed = new EmbedBuilder()
        .setTitle("🔄 Confirm Structure Update")
        .setDescription(
            `Are you sure you want to update this structure?\n\n` +
            `**Current Name:** ${structure.name}\n` +
            `**New Name:** ${updatedName}\n\n` +
            `**Current Category:** ${structure.category}\n` +
            `**New Category:** ${updatedCategory}`
        )
        .setColor(0xf1c40f);

    // ✅ Add confirmation buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`confirm_update_${guildId}_${structure.id}_${updatedName}_${updatedCategory}`)
            .setLabel("✅ Confirm")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`cancel_update_${guildId}`)
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger)
    );

    await message.reply({ embeds: [embed], components: [row] });
}

/**
 * Handles the confirmation interaction for updating a structure.
 */
export async function handleUpdateStructureInteraction(interaction: ButtonInteraction, db: TownDatabase): Promise<void> {
    if (!interaction.customId.startsWith("confirm_update_") && !interaction.customId.startsWith("cancel_update_")) return;

    const [, action, guildId, , newName, newCategory] = interaction.customId.split("_");

    if (action === "update") {
        try {
            await db.updateStructureCategory(guildId, newName, newCategory);
            await db.logHistory(
                guildId,
                "structure_updated",
                `🔄 Updated structure: **${newName}** → Category: **${newCategory}**`,
                interaction.user.username
            );

            await interaction.update({ content: `✅ Structure **${newName}** updated to category **${newCategory}**.`, components: [] });
        } catch (error) {
            await Logger.handleError(interaction.message, "handleUpdateStructureInteraction", error, "❌ Failed to update structure.");
        }
    } else {
        await interaction.update({ content: "❌ Structure update **canceled**.", components: [] });
    }
}

