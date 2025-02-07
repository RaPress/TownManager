import { Database } from "sqlite3";

export const db = new Database("town_manager.db");

db.serialize(() => {
    // ✅ Milestones Table
    db.run(`
        CREATE TABLE IF NOT EXISTS milestones (
            structure_id INTEGER,
            level INTEGER,
            votes_required INTEGER,
            guild_id TEXT NOT NULL,
            PRIMARY KEY (structure_id, level, guild_id),
            FOREIGN KEY (structure_id) REFERENCES structures(id)
        )
    `);

    // ✅ Structures Table
    db.run(`
        CREATE TABLE IF NOT EXISTS structures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            max_level INTEGER DEFAULT 10,
            last_reset_adventure INTEGER DEFAULT 0,
            category TEXT DEFAULT 'General',
            guild_id TEXT NOT NULL
        )
    `);

    // ✅ Votes Table
    db.run(`
        CREATE TABLE IF NOT EXISTS votes (
            user_id TEXT,
            structure_id INTEGER,
            adventure_id INTEGER,
            votes INTEGER DEFAULT 1,
            guild_id TEXT NOT NULL,
            PRIMARY KEY (user_id, adventure_id, guild_id),
            FOREIGN KEY (structure_id) REFERENCES structures(id)
        )
    `);

    // ✅ Adventure Table
    db.run(`
        CREATE TABLE IF NOT EXISTS adventure (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL
        )
    `);

    // ✅ History Table
    db.run(`
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_type TEXT NOT NULL,
            description TEXT NOT NULL,
            user TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            guild_id TEXT NOT NULL
        )
    `);

    // ✅ Ensure last_reset_adventure exists in existing databases
    db.all("PRAGMA table_info(structures)", (err, rows: { name: string }[]) => {
        if (err) {
            console.error("❌ Error checking table schema:", err);
            return;
        }

        if (!Array.isArray(rows)) {
            console.error("❌ PRAGMA table_info(structures) did not return an array.");
            return;
        }

        const columnExists = rows.some((row) => row.name === "last_reset_adventure");

        if (!columnExists) {
            console.log("⚠️ Adding missing column: last_reset_adventure");
            db.run(
                "ALTER TABLE structures ADD COLUMN last_reset_adventure INTEGER DEFAULT 0",
                (alterErr) => {
                    if (alterErr) {
                        console.error("❌ Error adding last_reset_adventure:", alterErr);
                    } else {
                        console.log("✅ Successfully added last_reset_adventure column.");
                    }
                }
            );
        } else {
            console.log("✅ last_reset_adventure column already exists.");
        }
    });

    // ✅ Ensure votes column exists in votes table
    db.all("PRAGMA table_info(votes)", (err, rows: { name: string }[]) => {
        if (err) {
            console.error("❌ Error checking votes table schema:", err);
            return;
        }

        if (!Array.isArray(rows)) {
            console.error("❌ PRAGMA table_info(votes) did not return an array.");
            return;
        }

        const columnExists = rows.some((row) => row.name === "votes");

        if (!columnExists) {
            console.log("⚠️ Adding missing column: votes");
            db.run(
                "ALTER TABLE votes ADD COLUMN votes INTEGER DEFAULT 1",
                (alterErr) => {
                    if (alterErr) {
                        console.error("❌ Error adding votes column:", alterErr);
                    } else {
                        console.log("✅ Successfully added votes column.");
                    }
                }
            );
        } else {
            console.log("✅ votes column already exists.");
        }
    });

    // ✅ Ensure category column exists for existing databases
    db.all("PRAGMA table_info(structures)", (err, rows: { name: string }[]) => {
        if (err) {
            console.error("❌ Error checking table schema:", err);
            return;
        }

        const columnExists = rows.some((row) => row.name === "category");

        if (!columnExists) {
            console.log("⚠️ Adding missing column: category");
            db.run(
                "ALTER TABLE structures ADD COLUMN category TEXT DEFAULT 'General'",
                (alterErr) => {
                    if (alterErr) {
                        console.error("❌ Error adding category column:", alterErr);
                    } else {
                        console.log("✅ Successfully added category column.");
                    }
                }
            );
        } else {
            console.log("✅ Category column already exists.");
        }
    });

    // ✅ Ensure `guild_id` column exists in existing tables
    const tablesToCheck = ["structures", "milestones", "votes", "adventure", "history"];

    tablesToCheck.forEach((table) => {
        db.all(`PRAGMA table_info(${table})`, (err, rows: { name: string }[]) => {
            if (err) {
                console.error(`❌ Error checking ${table} table schema:`, err);
                return;
            }

            const guildIdExists = rows.some((row) => row.name === "guild_id");

            if (!guildIdExists) {
                console.log(`⚠️ Adding missing column: guild_id to ${table}`);
                db.run(
                    `ALTER TABLE ${table} ADD COLUMN guild_id TEXT NOT NULL DEFAULT 'global'`,
                    (alterErr) => {
                        if (alterErr) {
                            console.error(`❌ Error adding guild_id to ${table}:`, alterErr);
                        } else {
                            console.log(`✅ Successfully added guild_id to ${table}.`);
                        }
                    }
                );
            } else {
                console.log(`✅ guild_id column already exists in ${table}.`);
            }
        });
    });
});
