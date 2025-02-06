import { Database } from "sqlite3";

export const db = new Database("town_manager.db");

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS milestones (
      structure_id INTEGER,
      level INTEGER,
      votes_required INTEGER,
      PRIMARY KEY (structure_id, level),
      FOREIGN KEY (structure_id) REFERENCES structures(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      level INTEGER DEFAULT 1,
      max_level INTEGER DEFAULT 10,
      last_reset_adventure INTEGER DEFAULT 0  -- ✅ Tracks last level-up
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      user_id TEXT,
      structure_id INTEGER,
      adventure_id INTEGER,
      votes INTEGER DEFAULT 1,  -- ✅ Added column to store vote count
      PRIMARY KEY (user_id, adventure_id),
      FOREIGN KEY (structure_id) REFERENCES structures(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS adventure (
      id INTEGER PRIMARY KEY AUTOINCREMENT
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // ✅ Ensure last_reset_adventure exists in existing databases
    db.all("PRAGMA table_info(structures)", (err, rows: { name: string }[]) => {
        if (err) {
            console.error("❌ Error checking table schema:", err);
            return;
        }

        if (!Array.isArray(rows)) {
            console.error(
                "❌ PRAGMA table_info(structures) did not return an array.",
            );
            return;
        }

        const columnExists = rows.some(
            (row) => row.name === "last_reset_adventure",
        );

        if (!columnExists) {
            console.log("⚠️ Adding missing column: last_reset_adventure");
            db.run(
                "ALTER TABLE structures ADD COLUMN last_reset_adventure INTEGER DEFAULT 0",
                (alterErr) => {
                    if (alterErr) {
                        console.error(
                            "❌ Error adding last_reset_adventure:",
                            alterErr,
                        );
                    } else {
                        console.log(
                            "✅ Successfully added last_reset_adventure column.",
                        );
                    }
                },
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
            console.error(
                "❌ PRAGMA table_info(votes) did not return an array.",
            );
            return;
        }

        const columnExists = rows.some((row) => row.name === "votes");

        if (!columnExists) {
            console.log("⚠️ Adding missing column: votes");
            db.run(
                "ALTER TABLE votes ADD COLUMN votes INTEGER DEFAULT 1",
                (alterErr) => {
                    if (alterErr) {
                        console.error(
                            "❌ Error adding votes column:",
                            alterErr,
                        );
                    } else {
                        console.log("✅ Successfully added votes column.");
                    }
                },
            );
        } else {
            console.log("✅ votes column already exists.");
        }
    });
});
