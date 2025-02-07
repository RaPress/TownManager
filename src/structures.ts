import { Message } from "discord.js";
import { Database } from "sqlite3";
import { logHistory } from "./history"; // ✅ Import history logging

type Structure = {
    id: number;
    name: string;
    level: number;
    max_level: number;
    category: string;
};

type VoteResult = {
    total: number;
};

// ✅ Adds a new structure with an optional category
export async function addStructure(
    message: Message,
    args: string[],
    db: Database,
) {
    const structureName = args[0]?.trim();
    const category = args.slice(1).join(" ").trim() || "General"; // ✅ Default category if not provided

    if (!structureName) {
        return message.reply("❌ Usage: `!add_structure <name> [category]`");
    }

    db.run(
        "INSERT INTO structures (name, level, max_level, category) VALUES (?, 1, 10, ?)",
        [structureName, category],
        (err) => {
            if (err) {
                return message.reply(
                    `⚠ Structure '${structureName}' already exists.`,
                );
            }

            message.reply(
                `✅ Structure '${structureName}' has been added to category **${category}**!`,
            );

            logHistory(
                db,
                "Structure Added",
                `${message.author.tag} added structure '${structureName}' in category '${category}'`,
                message.author.tag
            );
        },
    );
}

// ✅ Lists structures, optionally filtering by category
export async function listStructures(message: Message, args: string[], db: Database) {
    const categoryFilter = args.join(" ").trim();

    let query = "SELECT name, level, category FROM structures";
    const params: string[] = [];

    if (categoryFilter) {
        query += " WHERE LOWER(category) = LOWER(?)";
        params.push(categoryFilter);
    }

    db.all(query, params, (err, rows: Structure[]) => {
        if (err || rows.length === 0) {
            return message.reply(categoryFilter
                ? `❌ No structures found in category '${categoryFilter}'.`
                : "❌ No structures exist.");
        }

        const structureList = rows
            .map((s: Structure) => `${s.name} (Lv. ${s.level}) - **${s.category}**`)
            .join("\n");

        message.reply(`🏛 **Town Structures:**\n${structureList}`);

        logHistory(
            db,
            "Structures Listed",
            `${message.author.tag} listed structures in category '${categoryFilter || "All"}'.`,
            message.author.tag
        );
    });
}

// ✅ Checks total votes on a structure and logs it
export async function checkVotes(
    message: Message,
    args: string[],
    db: Database,
) {
    if (args.length === 0) {
        db.all(
            `SELECT s.name, s.category, COALESCE(SUM(v.votes), 0) AS total_votes
             FROM structures s
             LEFT JOIN votes v ON s.id = v.structure_id
             GROUP BY s.id`,
            [],
            (err, rows: { name: string; category: string; total_votes: number }[]) => {
                if (err || rows.length === 0) {
                    return message.reply("❌ No structures exist.");
                }

                const structureVotes = rows
                    .map((row) => `${row.name} (${row.category}): ${row.total_votes} votes`)
                    .join("\n");

                message.reply(
                    `📊 **Total votes for all structures:**\n${structureVotes}`,
                );

                logHistory(
                    db,
                    "Votes Checked",
                    `${message.author.tag} checked votes for all structures.`,
                    message.author.tag
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
            "SELECT id, last_reset_adventure, name, category FROM structures WHERE LOWER(name) = ?",
            [structureName],
            (
                err,
                structure: {
                    id: number;
                    last_reset_adventure: number;
                    name: string;
                    category: string;
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
                    `✅ Found structure: ${structure.name} (ID: ${structure.id}, Category: ${structure.category})`,
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
                            `📊 **Total votes for '${structure.name}' (${structure.category}) since last level-up: ${totalVotes}**`,
                        );

                        logHistory(
                            db,
                            "Votes Checked",
                            `${message.author.tag} checked votes for structure '${structure.name}': ${totalVotes} votes.`,
                            message.author.tag
                        );
                    },
                );
            },
        );
    }
}

// ✅ Sets milestone votes for structure levels and logs it
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

            logHistory(
                db,
                "Milestones Set",
                `${message.author.tag} set milestones for '${structureName}': ${milestoneVotes.join(", ")} votes per level.`,
                message.author.tag
            );
        },
    );
}
