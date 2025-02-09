import { Message } from "discord.js";
import { TownDatabase } from "../database/db";
import { HistoryLog } from "../types/database";

/**
 * Fetches and displays the history of actions in the town.
 */
export async function fetchHistory(message: Message, db: TownDatabase): Promise<void> {
    try {
        const history: HistoryLog[] = await db.getHistory(message.guild!.id);

        if (!history || history.length === 0) {
            await message.reply("📜 No history available.");
            return;
        }

        const formattedHistory = history
            .map((h) => `📌 **${new Date(h.timestamp).toLocaleString()}** - ${h.action}`)
            .join("\n");

        await message.reply(`📜 **Recent History:**\n${formattedHistory}`);
    } catch (error) {
        console.error("Error fetching history:", error);
        await message.reply("❌ Error fetching history.");
    }
}
