import { Message } from "discord.js";
import { TownDatabase } from "../database/db";
import { Vote } from "../types/database";

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
            voteCounts[vote.votedFor] = (voteCounts[vote.votedFor] || 0) + 1;
        });

        const results = Object.entries(voteCounts)
            .map(([playerId, count]) => `👤 <@${playerId}>: **${count} votes**`)
            .join("\n");

        await db.logHistory(guildId, `📊 **${message.author.username}** checked vote results.`);

        await message.reply(`📊 **Voting Results:**\n${results}`);
    } catch (error) {
        console.error("Error checking votes:", error);
        await message.reply("❌ Error checking votes.");
    }
}
