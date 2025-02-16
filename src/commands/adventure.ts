import { Message } from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";

/**
 * Ends an adventure and starts a voting session.
 */
export async function endAdventure(message: Message, args: Record<string, string>, db: TownDatabase, guildId: string): Promise<void> {
    const mentionedPlayers = message.mentions.users.map((user) => user.id);

    if (mentionedPlayers.length === 0) {
        await message.reply("❌ You must mention players who will participate in the vote.");
        return;
    }

    try {
        await db.startVoteSession(guildId, mentionedPlayers);

        await db.logHistory(
            guildId,
            "adventure_ended",
            `⚔️ Ended an adventure and started a voting session for ${mentionedPlayers.length} players.`,
            message.author.username
        );

        await message.reply("🏆 The adventure has ended! A voting session will now begin.");
    } catch (error) {
        await Logger.handleError(message, "endAdventure", error, "❌ Error ending adventure.");
    }
}
