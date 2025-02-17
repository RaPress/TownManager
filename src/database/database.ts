import fs from "fs";
import path from "path";
import { Database } from "sqlite3";

const dbPath = path.resolve(__dirname, "../town_manager.db");

// ✅ Check if the database file exists before opening
if (!fs.existsSync(dbPath)) {
    console.warn("⚠️ Database file not found! Creating a new database at:", dbPath);
}

export const db = new Database(dbPath, (err) => {
    if (err) {
        console.error("❌ Error opening database:", err);
    } else {
        console.log("✅ Database connected:", dbPath);
    }
});

// ✅ Function to check and add missing columns
function ensureColumnExists(table: string, column: string, columnDefinition: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${table})`, (err, rows: { name: string }[]) => {
            if (err) {
                console.error(`❌ Error checking ${table} table schema:`, err);
                reject(err);
                return;
            }

            const columnExists = rows.some((row) => row.name === column);

            if (!columnExists) {
                console.log(`⚠️ Adding missing column: ${column} to ${table}`);
                db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDefinition}`, (alterErr) => {
                    if (alterErr) {
                        console.error(`❌ Error adding ${column} to ${table}:`, alterErr);
                        reject(alterErr);
                    } else {
                        console.log(`✅ Successfully added ${column} to ${table}.`);
                        resolve();
                    }
                });
            } else {
                console.log(`✅ ${column} column already exists in ${table}.`);
                resolve();
            }
        });
    });
}

// ✅ Table creation
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS structures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            max_level INTEGER DEFAULT 10,
            last_reset_adventure INTEGER DEFAULT 0,
            category TEXT DEFAULT 'General',
            guild_id TEXT NOT NULL
        )`, () => console.log("✅ Ensured 'structures' table exists.")
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS milestones (
            structure_id INTEGER,
            level INTEGER,
            votes_required INTEGER,
            guild_id TEXT NOT NULL,
            PRIMARY KEY (structure_id, level, guild_id),
            FOREIGN KEY (structure_id) REFERENCES structures(id)
        )`, () => console.log("✅ Ensured 'milestones' table exists.")
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS votes (
            user_id TEXT,
            structure_id INTEGER,
            adventure_id INTEGER,
            votes INTEGER DEFAULT 1,
            guild_id TEXT NOT NULL,
            PRIMARY KEY (user_id, adventure_id, guild_id),
            FOREIGN KEY (structure_id) REFERENCES structures(id)
        )`, () => console.log("✅ Ensured 'votes' table exists.")
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS adventure (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL
        )`, () => console.log("✅ Ensured 'adventure' table exists.")
    );

    db.run(`
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_type TEXT NOT NULL,
            description TEXT NOT NULL,
            user TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            guild_id TEXT NOT NULL
        )`, () => console.log("✅ Ensured 'history' table exists.")
    );

    // ✅ Ensure missing columns exist
    Promise.all([
        ensureColumnExists("structures", "last_reset_adventure", "INTEGER DEFAULT 0"),
        ensureColumnExists("votes", "votes", "INTEGER DEFAULT 1"),
        ensureColumnExists("structures", "category", "TEXT DEFAULT 'General'"),
        ensureColumnExists("structures", "guild_id", "TEXT NOT NULL DEFAULT 'global'"),
        ensureColumnExists("milestones", "guild_id", "TEXT NOT NULL DEFAULT 'global'"),
        ensureColumnExists("votes", "guild_id", "TEXT NOT NULL DEFAULT 'global'"),
        ensureColumnExists("adventure", "guild_id", "TEXT NOT NULL DEFAULT 'global'"),
        ensureColumnExists("history", "guild_id", "TEXT NOT NULL DEFAULT 'global'")
    ])
        .then(() => {
            console.log("✅ Database schema integrity check complete.");

            // ✅ Final check: Ensure database is not empty
            db.get("SELECT COUNT(*) AS count FROM structures", [], (err, row: { count: number } | undefined) => {
                if (err) {
                    console.error("❌ Error checking database integrity:", err);
                } else if (row && row.count === 0) {
                    console.warn("⚠️ WARNING: The database is empty! Data might have been lost.");
                }
            });

        })
        .catch((err) => {
            console.error("❌ Error ensuring database schema:", err);
        });
});
