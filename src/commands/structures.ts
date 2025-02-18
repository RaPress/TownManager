import { Message } from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Adds a new structure to the town.
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

    try {
        await db.addStructure(guildId, structureName, category);
        await db.logHistory(
            guildId,
            "structure_added",
            `🏗️ Added structure: **${structureName}** (Category: ${category})`,
            message.author.username
        );

        await message.reply(`✅ Structure **${structureName}** added successfully in category **${category}**!`);
    } catch (error) {
        await Logger.handleError(message, "addStructure", error, "❌ Failed to add structure.");
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
    const newName = options["newname"];
    const newCategory = options["category"] || options["cat"];

    if (!structureName) {
        await message.reply("❌ You must provide a structure name.");
        return;
    }

    try {
        if (newCategory) {
            // ✅ Update category
            await db.updateStructureCategory(guildId, structureName, newCategory);
            await db.logHistory(
                guildId,
                "structure_updated",
                `🔄 Updated structure: **${structureName}** → Category: **${newCategory}**`,
                message.author.username
            );

            await message.reply(`✅ Structure **${structureName}** updated to category **${newCategory}**.`);
        }

        if (newName) {
            // ✅ Rename structure
            await db.renameStructure(guildId, structureName, newName);
            await db.logHistory(
                guildId,
                "structure_renamed",
                `✏️ Renamed structure: **${structureName}** → **${newName}**`,
                message.author.username
            );

            await message.reply(`✅ Structure **${structureName}** renamed to **${newName}**.`);
        }

        if (!newCategory && !newName) {
            await message.reply("❌ You must provide either a new category or a new name.");
        }
    } catch (error) {
        await Logger.handleError(message, "updateStructure", error, "❌ Failed to update structure.");
    }
}
