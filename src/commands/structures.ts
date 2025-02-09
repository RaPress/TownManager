import { Message } from "discord.js";
import { TownDatabase } from "../database/db";

export async function addStructure(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    if (args.length === 0) {
        await message.reply("❌ Please provide a structure name.");
        return;
    }

    const structureName = args.join(" ");
    try {
        await db.addStructure(guildId, structureName);
        await db.logHistory(guildId, `🏗️ **${message.author.username}** added structure: **${structureName}**`);

        await message.reply(`✅ Structure **${structureName}** added successfully!`);
    } catch (error) {
        console.error("Error adding structure:", error);
        await message.reply("❌ Error adding structure. Please try again.");
    }
}


export async function listStructures(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    try {
        const structures = await db.getStructures(guildId);

        if (!structures || structures.length === 0) {
            await message.reply("📭 No structures found.");
            return;
        }

        const structureList = structures.map((s: any) => `🏗️ ${s.name}`).join("\n");
        await message.reply(`📋 **Structures List:**\n${structureList}`);
    } catch (error) {
        console.error("Error fetching structures:", error);
        await message.reply("❌ Error fetching structures.");
    }
}
