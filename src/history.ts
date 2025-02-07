import { Message } from "discord.js";
import { Database } from "sqlite3";

// ✅ Logs an action to history
export function logHistory(
    db: Database,
    actionType: string,
    description: string,
    user: string,
) {
    db.run(
        "INSERT INTO history (action_type, description, user, timestamp) VALUES (?, ?, ?, datetime('now'))",
        [actionType, description, user],
    );
}

// ✅ Fetches history with user tracking
export async function fetchHistory(message: Message, db: Database) {
    const args = message.content.split(" ").slice(1);
    const filter = args.join(" ").toLowerCase().trim();

    let query = "SELECT event, description, user, timestamp FROM history ORDER BY timestamp DESC LIMIT 10"; // Default: Last 10 logs
    let filterText = "🔍 **Recent Town History:**";

    if (filter === "structures") {
        query =
            "SELECT event, description, user, timestamp FROM history WHERE action_type = 'upgrade' ORDER BY timestamp DESC LIMIT 10";
        filterText = "🏗 **Recent Structure Upgrades:**";
    } else if (filter === "votes") {
        query =
            "SELECT event, description, user, timestamp FROM history WHERE action_type = 'vote' ORDER BY timestamp DESC LIMIT 10";
        filterText = "🗳 **Recent Voting Records:**";
    } else if (filter === "milestones") {
        query =
            "SELECT event, description, user, timestamp FROM history WHERE action_type = 'milestone' ORDER BY timestamp DESC LIMIT 10";
        filterText = "📏 **Recent Milestone Changes:**";
    }

    db.all(
        query,
        [],
        (err, rows: { event: string; description: string; user: string; timestamp: string }[]) => {
            if (err) {
                console.error("❌ Database error while fetching history:", err);
                return message.reply("❌ Database error.");
            }

            if (!rows || rows.length === 0) {
                return message.reply("📜 No history found.");
            }

            const historyEntries = rows
                .map(
                    (row) =>
                        `📜 **${row.timestamp}** → ${row.description} *(by ${row.user})*`
                )
                .join("\n");

            message.reply(`${filterText}\n${historyEntries}`);
        },
    );
}
