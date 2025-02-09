import { Database } from "sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../town_manager.db");
export const db = new Database(dbPath, (err) => {
    if (err) {
        console.error("❌ Error opening database:", err);
    } else {
        console.log("✅ Database connected:", dbPath);
    }
});

// ✅ Function to check and add missing columns
function ensureColumnExists(table: string, column: string, columnDefinition: string) {
    db.all(`PRAGMA table_info(${table})`, (err, rows: { name: string }[]) => {
        if (err) {
            console.error(`❌ Error checking ${table} table schema:`, err);
            return;
        }

        if (!Array.isArray(rows)) {
            console.error(`❌ PRAGMA table_info(${table}) did not return an array.`);
            return;
        }

        const columnExists = rows.some((row) => row.name === column);

        if (!columnExists) {
            console.log(`⚠️ Adding missing column: ${column} to ${table}`);
            db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDefinition}`, (alterErr) => {
                if (alterErr) {
                    console.error(`❌ Error adding ${column} to ${table}:`, alterErr);
                } else {
                    console.log(`✅ Successfully added ${column} to ${table}.`);
                }
            });
        } else {
            console.log(`✅ ${column} column already exists in ${table}.`);
        }
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
        )
    `);

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

    db.run(`
        CREATE TABLE IF NOT EXISTS adventure (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL
        )
    `);

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

    // ✅ Ensure missing columns exist
    ensureColumnExists("structures", "last_reset_adventure", "INTEGER DEFAULT 0");
    ensureColumnExists("votes", "votes", "INTEGER DEFAULT 1");
    ensureColumnExists("structures", "category", "TEXT DEFAULT 'General'");

    const tablesToCheck = ["structures", "milestones", "votes", "adventure", "history"];
    tablesToCheck.forEach((table) => ensureColumnExists(table, "guild_id", "TEXT NOT NULL DEFAULT 'global'"));
});
