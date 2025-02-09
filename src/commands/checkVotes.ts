import { Message } from "discord.js";
import { Vote } from "../database/dbTypes";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Checks and displays the current votes.
 */
export async function checkVotes(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    try {
        const votes: Vote[] = await db.getVotes(guildId);

        if (!votes || votes.length === 0) {
            await message.reply("🗳️ No votes have been cast yet.");
            return;
        }

        const voteCounts: Record<string, number> = {};
        votes.forEach((vote) => {
            voteCounts[vote.structure_id] = (voteCounts[vote.structure_id] || 0) + 1;
        });

        const results = Object.entries(voteCounts)
            .map(([structureId, count]) => `🏗️ Structure ID **${structureId}**: **${count} votes**`)
            .join("\n");

        await db.logHistory(
            guildId,
            "vote_results_checked",
            `📊 Checked vote results`,
            message.author.username
        );

        await message.reply(`📊 **Voting Results:**\n${results}`);
    } catch (error) {
        await Logger.handleError(message, "checkVotes", error, "❌ Error checking votes.");
    }
}
