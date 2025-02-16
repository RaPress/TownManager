import { Message } from "discord.js";
import { Vote } from "../database/dbTypes";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Retrieves structure names mapped to their IDs for readability.
 */
async function getStructureMap(db: TownDatabase, guildId: string): Promise<Record<number, string>> {
    const structures = await db.getStructures(guildId);
    return Object.fromEntries(structures.map((s) => [s.id, s.name]));
}

/**
 * Aggregates vote counts per structure.
 */
function countVotes(votes: Vote[], structureMap: Record<number, string>): Record<string, number> {
    return votes.reduce((acc, vote) => {
        const structureName = structureMap[vote.structure_id] || `Unknown (ID: ${vote.structure_id})`;
        acc[structureName] = (acc[structureName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

/**
 * Checks and displays the current votes.
 */
export async function checkVotes(message: Message, args: Record<string, string>, db: TownDatabase, guildId: string): Promise<void> {
    try {
        const votes = await db.getVotes(guildId);
        if (!votes.length) {
            await message.reply("🗳️ No votes have been cast yet.");
            return;
        }

        const structureMap = await getStructureMap(db, guildId);
        const voteCounts = countVotes(votes, structureMap);

        const results = Object.entries(voteCounts)
            .map(([structure, count]) => `🏗️ **${structure}**: **${count} votes**`)
            .join("\n");

        await db.logHistory(guildId, "vote_results_checked", `📊 Checked vote results for ${Object.keys(voteCounts).length} structures.`, message.author.username);
        await message.reply(`📊 **Voting Results:**\n${results}`);
    } catch (error) {
        await Logger.handleError(message, "checkVotes", error, "❌ Error checking votes.");
    }
}
