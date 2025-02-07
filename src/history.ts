import { Message } from "discord.js";
import { Database } from "sqlite3";

// ✅ Logs an action to history with `guild_id`
export function logHistory(
    db: Database,
    actionType: string,
    description: string,
    user: string,
    guildId: string
) {
    db.run(
        "INSERT INTO history (action_type, description, user, timestamp, guild_id) VALUES (?, ?, ?, datetime('now'), ?)",
        [actionType, description, user, guildId],
        (err) => {
            if (err) {
                console.error("❌ Error logging history:", err);
            }
        }
    );
}

// ✅ Fetches history with `guild_id` filtering
export async function fetchHistory(message: Message, db: Database) {
    const guildId = message.guild?.id;
    if (!guildId) return message.reply("❌ Unable to determine server.");

    const args = message.content.split(" ").slice(1);
    const filter = args.join(" ").toLowerCase().trim();

    let query = "SELECT * FROM history WHERE guild_id = ? ORDER BY timestamp DESC LIMIT 10";
    let filterText = "🔍 **Recent Town History:**";
    const params: string[] = [guildId];

    if (filter === "structures") {
        query =
            "SELECT * FROM history WHERE action_type = 'upgrade' AND guild_id = ? ORDER BY timestamp DESC LIMIT 10";
        filterText = "🏗 **Recent Structure Upgrades:**";
    } else if (filter === "votes") {
        query =
            "SELECT * FROM history WHERE action_type = 'vote' AND guild_id = ? ORDER BY timestamp DESC LIMIT 10";
        filterText = "🗳 **Recent Voting Records:**";
    } else if (filter === "milestones") {
        query =
            "SELECT * FROM history WHERE action_type = 'milestone' AND guild_id = ? ORDER BY timestamp DESC LIMIT 10";
        filterText = "📏 **Recent Milestone Changes:**";
    }

    db.all(query, params, (err, rows: { action_type: string; description: string; user: string; timestamp: string }[]) => {
        if (err || rows.length === 0) {
            console.error("❌ Database error while fetching history:", err);
            return message.reply("❌ No history records found.");
        }

        const historyEntries = rows
            .map(
                (row) =>
                    `📜 **${row.timestamp}** → ${row.description} *(by ${row.user})*`
            )
            .join("\n");

        message.reply(`${filterText}\n${historyEntries}`);
    });
}
