import { Message } from "discord.js";
import { Database } from "sqlite3";
import { logHistory } from "./history";

type Milestone = {
    structure_id: number;
    level: number;
    votes_required: number;
};

type StructureWithMilestones = {
    name: string;
    milestones: string;
};

// ✅ Lists milestones for all structures or a specific one
export async function listMilestones(message: Message, args: string[], db: Database) {
    if (args.length === 0) {
        // ✅ General Listing: Show all structures and their milestones
        db.all(
            `SELECT s.name, GROUP_CONCAT(m.votes_required, ', ') AS milestones
FROM structures s
LEFT JOIN milestones m ON s.id = m.structure_id
GROUP BY s.id`,
            [],
            (err, rows: StructureWithMilestones[]) => {
                if (err || rows.length === 0) {
                    return message.reply("❌ No milestones found.");
                }

                const milestoneList = rows
                    .map(row => `${row.name}: ${row.milestones || "No milestones set"}`)
                    .join("\n");

                message.reply(`📏 **Milestones for all structures:**\n${milestoneList}`);

                logHistory(db, "Milestones Listed", `${message.author.tag} listed all milestones.`);
            }
        );
    } else {
        const structureName = args.join(" ").trim().toLowerCase();

        // ✅ Specific Listing: Show milestones for a given structure
        db.all(
            `SELECT level, votes_required FROM milestones 
WHERE structure_id = (SELECT id FROM structures WHERE LOWER(name) = ?) 
ORDER BY level`,
            [structureName],
            (err, rows: Milestone[]) => {
                if (err) {
                    return message.reply("❌ Database error.");
                }

                if (rows.length === 0) {
                    return message.reply(`❌ No milestones found for '${structureName}'.`);
                }

                const milestoneDetails = rows
                    .map(m => `• Level ${m.level}: ${m.votes_required} votes required`)
                    .join("\n");

                message.reply(`📏 **Milestones for '${structureName}':**\n${milestoneDetails}`);

                logHistory(db, "Milestone Checked", `${message.author.tag} checked milestones for '${structureName}'.`);
            }
        );
    }
}

// ✅ Sets milestone votes for structure levels and logs it
export async function setMilestones(message: Message, args: string[], db: Database) {
    const structureName = args[0]?.trim();
    const milestoneVotes = args.slice(1).map(v => parseInt(v, 10)).filter(v => !isNaN(v));

    if (!structureName || milestoneVotes.length === 0) {
        return message.reply(
            "❌ **Usage:** `!set_milestones <structure_name> <votes_level_2> <votes_level_3> ...`"
        );
    }

    db.get(
        "SELECT id FROM structures WHERE LOWER(name) = ?",
        [structureName.toLowerCase()],
        (err, row: { id: number } | undefined) => {
            if (err) {
                console.error("❌ Database error:", err);
                return message.reply("❌ An error occurred while setting milestones.");
            }

            if (!row) {
                return message.reply(`❌ Structure '**${structureName}**' does not exist.`);
            }

            db.run("DELETE FROM milestones WHERE structure_id = ?", [row.id], (delErr) => {
                if (delErr) {
                    console.error("❌ Error deleting old milestones:", delErr);
                    return message.reply("❌ Failed to reset previous milestones.");
                }

                const insertStatements = milestoneVotes.map((votes, index) => {
                    return new Promise<void>((resolve, reject) => {
                        db.run(
                            "INSERT INTO milestones (structure_id, level, votes_required) VALUES (?, ?, ?)",
                            [row.id, index + 2, votes],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                });

                Promise.all(insertStatements)
                    .then(() => {
                        message.reply(
                            `✅ **Milestones set for '${structureName}':** ${milestoneVotes.join(", ")} votes per level.`
                        );

                        logHistory(
                            db,
                            "Milestones Set",
                            `${message.author.tag} set milestones for '${structureName}': ${milestoneVotes.join(", ")} votes per level.`,
                            message.author.tag
                        );
                    })
                    .catch((insertErr) => {
                        console.error("❌ Error inserting milestones:", insertErr);
                        message.reply("❌ Failed to save milestone data.");
                    });
            });
        }
    );
}
