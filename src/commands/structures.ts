import { Message } from "discord.js";
import { Logger } from "../utils/logger";
import { Structure } from "../database/dbTypes";
import { TownDatabase } from "../database/db";

export async function addStructure(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    if (args.length === 0) {
        await message.reply("❌ Please provide a structure name.");
        return;
    }

    const structureName = args.join(" ");
    try {
        await db.addStructure(guildId, structureName);
        await db.logHistory(
            guildId,
            "structure_added",
            `🏗️ Added structure: **${structureName}**`,
            message.author.username
        );

        await message.reply(`✅ Structure **${structureName}** added successfully!`);
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
