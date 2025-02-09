import { Message } from "discord.js";
import { TownDatabase } from "../database/db";
import { HistoryLog } from "../database/dbTypes";
import { Logger } from "../utils/logger";

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
            .map((h) => `📌 **${new Date(h.timestamp).toLocaleString()}** - ${h.action_type}: ${h.description}`)
            .join("\n");

        await message.reply(`📜 **Recent History:**\n${formattedHistory}`);
        await db.logHistory(
            message.guild!.id,
            "history_viewed",
            `📜 Checked the history log`,
            message.author.username
        );

    } catch (error) {
        await Logger.handleError(message, "fetchHistory", error, "❌ Error fetching history.");
    }
}
