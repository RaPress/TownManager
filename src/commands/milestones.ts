import { Message } from "discord.js";
import { TownDatabase } from "../database/db";

/**
 * Sets a new milestone for the town.
 */
export async function setMilestones(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    if (args.length < 2) {
        await message.reply("❌ Please provide a milestone name and value.");
        return;
    }

    const milestoneName = args[0];
    const milestoneValue = parseInt(args[1]);

    if (isNaN(milestoneValue)) {
        await message.reply("❌ Milestone value must be a number.");
        return;
    }

    try {
        await db.setMilestone(guildId, milestoneName, milestoneValue);
        await db.logHistory(guildId, `🏆 **${message.author.username}** set milestone **${milestoneName}** to **${milestoneValue}**.`);

        await message.reply(`✅ Milestone **${milestoneName}** set to **${milestoneValue}**.`);
    } catch (error) {
        console.error("Error setting milestone:", error);
        await message.reply("❌ Error setting milestone.");
    }
}

/**
 * Lists all milestones.
 */
export async function listMilestones(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    try {
        const milestones = await db.getMilestones(guildId);

        if (!milestones || milestones.length === 0) {
            await message.reply("📜 No milestones found.");
            return;
        }

        const milestoneList = milestones.map((m: any) => `🏆 ${m.name}: **${m.value}**`).join("\n");
        await db.logHistory(guildId, `📜 **${message.author.username}** checked the milestone list.`);

        await message.reply(`📋 **Milestones List:**\n${milestoneList}`);
    } catch (error) {
        console.error("Error fetching milestones:", error);
        await message.reply("❌ Error fetching milestones.");
    }
}
