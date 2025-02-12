import { Message } from "discord.js";
import { Logger } from "../utils/logger";
import { Structure } from "../database/dbTypes";
import { TownDatabase } from "../database/db";

export async function addStructure(
    message: Message,
    args: string[],
    db: TownDatabase,
    guildId: string
): Promise<void> {
    if (args.length === 0) {
        await message.reply("❌ Please provide a structure name.");
        return;
    }

    // Extract structure name & category from arguments
    const structureName = args.filter(arg => !arg.startsWith("category=") && !arg.startsWith("cat=")).join(" ");
    const categoryArg = args.find(arg => arg.startsWith("category=") || arg.startsWith("cat="));
    const category = categoryArg ? categoryArg.split("=")[1] : "General"; // Default to 'General' if no category is given

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

export async function listStructures(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    try {
        const structures = await db.getStructures(guildId);

        if (!structures || structures.length === 0) {
            await message.reply("📭 No structures found.");
            return;
        }

        const structureList = structures.map((s: Structure) => `🏗️ ${s.name} (Level ${s.level}) - Category: ${s.category}`).join("\n");
        await message.reply(`📋 **Structures List:**\n${structureList}`);
    } catch (error) {
        await Logger.handleError(message, "listStructures", error, "❌ Failed getting structures.");
    }
}

export async function removeStructure(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    if (args.length === 0) {
        await message.reply("❌ Please provide a structure name.");
        return;
    }

    const structureName = args.join(" ");
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
export async function updateStructure(
    message: Message,
    args: string[],
    db: TownDatabase,
    guildId: string
): Promise<void> {
    if (args.length < 2) {
        await message.reply("❌ Usage: `!update_structure <name> category=<new_category>`");
        return;
    }

    const structureName = args.filter(arg => !arg.startsWith("category=") && !arg.startsWith("cat=")).join(" ");
    const categoryArg = args.find(arg => arg.startsWith("category=") || arg.startsWith("cat="));
    const newCategory = categoryArg ? categoryArg.split("=")[1] : null;

    if (!structureName || !newCategory) {
        await message.reply("❌ You must provide a structure name and new category.");
        return;
    }

    try {
        await db.updateStructureCategory(guildId, structureName, newCategory);
        await db.logHistory(
            guildId,
            "structure_updated",
            `🔄 Updated structure: **${structureName}** → Category: **${newCategory}**`,
            message.author.username
        );

        await message.reply(`✅ Structure **${structureName}** updated to category **${newCategory}**.`);
    } catch (error) {
        await Logger.handleError(message, "updateStructure", error, "❌ Failed to update structure.");
    }
}
