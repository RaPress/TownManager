import { Message } from "discord.js";
import { TownDatabase } from "../database/db";

/**
 * Ends an adventure and starts a voting session.
 */
export async function endAdventure(message: Message, args: string[], db: TownDatabase, guildId: string): Promise<void> {
    const mentionedPlayers = message.mentions.users.map((user) => user.id);

    if (mentionedPlayers.length === 0) {
        await message.reply("❌ You must mention players who will participate in the vote.");
        return;
    }

    try {
        await db.logHistory(guildId, `⚔️ **${message.author.username}** ended an adventure.`);
        await message.reply("🏆 The adventure has ended! A voting session will now begin.");
    } catch (error) {
        console.error("Error ending adventure:", error);
        await message.reply("❌ Error ending adventure.");
    }
}
