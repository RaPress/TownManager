import { Message } from "discord.js";
import { Database } from "sqlite3";

type Structure = {
    id: number;
    name: string;
    level: number;
    max_level: number;
};

type VoteResult = {
    total: number;
};

// ✅ Adds a new structure
export async function addStructure(
    message: Message,
    args: string[],
    db: Database,
) {
    const structureName = args.join(" ").trim();
    if (!structureName) {
        return message.reply("❌ Please provide a structure name.");
    }

    db.run(
        "INSERT INTO structures (name, level, max_level) VALUES (?, 1, 10)",
        [structureName],
        (err) => {
            if (err)
                return message.reply(
                    `⚠ Structure '${structureName}' already exists.`,
                );
            message.reply(`✅ Structure '${structureName}' has been added!`);
        },
    );
}

// ✅ Lists all structures
export async function listStructures(message: Message, db: Database) {
    db.all(
        "SELECT name, level FROM structures",
        [],
        (err, rows: Structure[]) => {
            if (err || rows.length === 0) {
                return message.reply("❌ No structures exist.");
            }

            const structureList = rows
                .map((s: Structure) => `${s.name} - Level ${s.level}`)
                .join("\n");
            message.reply(`🏛 **Town Structures:**\n${structureList}`);
        },
    );
}

// ✅ Checks total votes on a structure
export async function checkVotes(
    message: Message,
    args: string[],
    db: Database,
) {
    if (args.length === 0) {
        // ✅ No arguments: List all structures with their total votes
        db.all(
            `SELECT s.name, COALESCE(SUM(v.votes), 0) AS total_votes
             FROM structures s
             LEFT JOIN votes v ON s.id = v.structure_id
             GROUP BY s.id`,
            [],
            (err, rows: { name: string; total_votes: number }[]) => {
                if (err || rows.length === 0) {
                    return message.reply("❌ No structures exist.");
                }

                const structureVotes = rows
                    .map((row) => `${row.name}: ${row.total_votes} votes`)
                    .join("\n");

                message.reply(
                    `📊 **Total votes for all structures:**\n${structureVotes}`,
                );
            },
        );
    } else {
        const structureName = args.join(" ").trim().toLowerCase();

        if (!structureName) {
            return message.reply("❌ Please provide a structure name.");
        }

        console.log(`🔍 Checking votes for structure: ${structureName}`);

        db.get(
            "SELECT id, last_reset_adventure, name FROM structures WHERE LOWER(name) = ?",
            [structureName],
            (
                err,
                structure: {
                    id: number;
                    last_reset_adventure: number;
                    name: string;
                },
            ) => {
                if (err) {
                    console.error("❌ Database error:", err);
                    return message.reply(
                        "❌ An error occurred while checking votes.",
                    );
                }

                if (!structure) {
                    console.warn(
                        `⚠️ Structure '${structureName}' not found in database.`,
                    );
                    return message.reply(
                        `❌ Structure '${structureName}' does not exist.`,
                    );
                }

                console.log(
                    `✅ Found structure: ${structure.name} (ID: ${structure.id})`,
                );

                db.get(
                    "SELECT COUNT(*) AS total FROM votes WHERE structure_id = ? AND adventure_id > ?",
                    [structure.id, structure.last_reset_adventure || 0],
                    (err, result: VoteResult | undefined) => {
                        if (err) {
                            console.error("❌ Database error:", err);
                            return message.reply(
                                "❌ An error occurred while checking votes.",
                            );
                        }

                        const totalVotes = result?.total || 0;
                        console.log(
                            `📊 Total votes for '${structure.name}': ${totalVotes}`,
                        );

                        message.reply(
                            `📊 **Total votes for '${structure.name}' since last level-up: ${totalVotes}**`,
                        );
                    },
                );
            },
        );
    }
}

// ✅ Sets milestone votes for structure levels
export async function setMilestones(
    message: Message,
    args: string[],
    db: Database,
) {
    const structureName = args[0];
    const milestoneVotes = args.slice(1).map(Number);

    if (!structureName || milestoneVotes.some(isNaN)) {
        return message.reply(
            "❌ Usage: `!set_milestones <structure_name> <votes_level_2> <votes_level_3> ...`",
        );
    }

    db.get(
        "SELECT id FROM structures WHERE name = ?",
        [structureName],
        (err, row: Structure | undefined) => {
            if (err || !row) {
                return message.reply(
                    `❌ Structure '${structureName}' does not exist.`,
                );
            }

            db.run("DELETE FROM milestones WHERE structure_id = ?", [row.id]);

            milestoneVotes.forEach((votes, index) => {
                db.run(
                    "INSERT INTO milestones (structure_id, level, votes_required) VALUES (?, ?, ?)",
                    [row.id, index + 2, votes],
                );
            });

            message.reply(
                `✅ Milestones for '${structureName}' set successfully: ${milestoneVotes.join(", ")} votes required per level.`,
            );
        },
    );
}
