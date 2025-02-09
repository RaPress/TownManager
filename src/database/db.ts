import { Database } from "sqlite3";
import { Structure, Milestone, Vote, HistoryLog } from "../types/database";

export class TownDatabase {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async getStructures(guildId: string): Promise<Structure[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT id, guildId, name FROM structures WHERE guildId = ?",
                [guildId],
                (err, rows: Structure[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async addStructure(guildId: string, name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO structures (guildId, name) VALUES (?, ?)",
                [guildId, name],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getMilestones(guildId: string): Promise<Milestone[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT id, guildId, name, value FROM milestones WHERE guildId = ?",
                [guildId],
                (err, rows: Milestone[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async setMilestone(guildId: string, name: string, value: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO milestones (guildId, name, value) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET value = ?",
                [guildId, name, value, value],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async startVoteSession(guildId: string, players: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run("INSERT INTO vote_sessions (guildId, players) VALUES (?, ?)", [guildId, JSON.stringify(players)], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async recordVote(voterId: string, votedFor: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run("INSERT INTO votes (voterId, votedFor) VALUES (?, ?)", [voterId, votedFor], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async getVotes(guildId: string): Promise<Vote[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT id, guildId, voterId, votedFor FROM votes WHERE guildId = ?",
                [guildId],
                (err, rows: Vote[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getHistory(guildId: string): Promise<HistoryLog[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT id, guildId, action, timestamp FROM history WHERE guildId = ? ORDER BY timestamp DESC LIMIT 20",
                [guildId],
                (err, rows: HistoryLog[]) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async logHistory(guildId: string, action: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO history (guildId, action, timestamp) VALUES (?, ?, ?)",
                [guildId, action, Date.now()],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
}
