import { Message } from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";
import { Milestone } from "../types/dbTypes";

/**
 * Sets a new milestone for the town.
 */
export async function setMilestones(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    if (args.length < 3) {
        await message.reply("❌ Please provide a structure ID, level, and required votes.");
        return;
    }

    const structureId = parseInt(args[0]);
    const level = parseInt(args[1]);
    const votesRequired = parseInt(args[2]);

    if (isNaN(structureId) || isNaN(level) || isNaN(votesRequired)) {
        await message.reply("❌ Structure ID, level, and votes must be numbers.");
        return;
    }

    try {
        await db.setMilestone(guildId, structureId, level, votesRequired);
        await db.logHistory(
            guildId,
            "milestone_set",
            `🏆 Set milestone for Structure ID **${structureId}**, Level **${level}** to require **${votesRequired}** votes.`,
            message.author.username
        );

        await message.reply(`✅ Milestone for Structure ID **${structureId}**, Level **${level}** set to require **${votesRequired}** votes.`);
    } catch (error) {
        await Logger.handleError(message, "setMilestones", error, "❌ Error setting milestone.");
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

        const milestoneList = milestones.map((m: Milestone) => `🏆 ${m.structure_id} (Level ${m.level}): **${m.votes_required} votes required**`).join("\n");
        await db.logHistory(
            guildId,
            "milestone_list_checked",
            `📜 Checked the milestone list`,
            message.author.username
        );


        await message.reply(`📋 **Milestones List:**\n${milestoneList}`);
    } catch (error) {
        await Logger.handleError(message, "listMilestones", error, "❌ Error fetching milestones.");
    }
}
