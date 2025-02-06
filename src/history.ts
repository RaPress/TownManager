import { Database } from "sqlite3";

export function logHistory(db: Database, type: string, description: string) {
    db.run(
        "INSERT INTO history (type, description) VALUES (?, ?)",
        [type, description],
        (err) => {
            if (err) console.error("❌ Error logging history:", err);
        },
    );
}
