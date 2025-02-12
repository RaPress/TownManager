import { Database } from "sqlite3";
import { Logger } from "../utils/logger";
import {
    Structure,
    Milestone,
    Vote,
    HistoryLog,
    AdventureRow
} from "./dbTypes";

export class TownDatabase {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async getStructures(guildId: string): Promise<Structure[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT id, guild_id, name, level, max_level, category FROM structures WHERE guild_id = ?",
                [guildId],
                (err, rows: Structure[]) => {
                    if (err) {
                        Logger.logError("getStructures", err);
                        reject(err);
                    } else resolve(rows);
                }
            );
        });
    }

    async addStructure(guildId: string, name: string, category: string = "General"): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO structures (guild_id, name, category) VALUES (?, ?, ?)",
                [guildId, name, category],
                (err) => {
                    if (err) {
                        Logger.logError("addStructure", err);
                        reject(err);
                    } else resolve();
                }
            );
        });
    }

    async removeStructure(guildId: string, structureName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "DELETE FROM structures WHERE guild_id = ? AND name = ?",
                [guildId, structureName],
                function (err) {
                    if (err) {
                        Logger.logError("removeStructure", err);
                        reject(err);
                    } else {
                        resolve(this.changes > 0);
                    }
                }
            );
        });
    }

    async updateStructureCategory(guildId: string, structureName: string, newCategory: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "UPDATE structures SET category = ? WHERE guild_id = ? AND name = ?",
                [newCategory, guildId, structureName],
                (err) => {
                    if (err) {
                        Logger.logError("updateStructureCategory", err);
                        reject(err);
                    } else resolve();
                }
            );
        });
    }

    async getMilestones(guildId: string): Promise<Milestone[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT structure_id, level, votes_required, guild_id FROM milestones WHERE guild_id = ?",
                [guildId],
                (err, rows: Milestone[]) => {
                    if (err) {
                        Logger.logError("getMilestones", err);
                        reject(err);
                    } else resolve(rows);
                }
            );
        });
    }

    async setMilestone(guildId: string, structureId: number, level: number, votesRequired: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO milestones (guild_id, structure_id, level, votes_required) VALUES (?, ?, ?, ?) ON CONFLICT(structure_id, level, guild_id) DO UPDATE SET votes_required = ?",
                [guildId, structureId, level, votesRequired, votesRequired],
                (err) => {
                    if (err) {
                        Logger.logError("setMilestone", err);
                        reject(err);
                    } else resolve();
                }
            );
        });
    }

    async startVoteSession(guildId: string, players: string[]): Promise<void> {
        try {
            const newAdventureId = await this.insertAdventure(guildId);

            for (const playerId of players) {
                await this.insertVote(playerId, newAdventureId, guildId);
            }

            Logger.logInfo(`✅ Started vote session (Adventure ID: ${newAdventureId}) with ${players.length} players.`);
        } catch (error) {
            Logger.logError("startVoteSession", error);
            throw error;
        }
    }

    private insertAdventure(guildId: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO adventure (guild_id) VALUES (?)",
                [guildId],
                function (err) {
                    if (err) {
                        Logger.logError("insertAdventure", err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    private insertVote(userId: string, adventureId: number, guildId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO votes (user_id, structure_id, adventure_id, votes, guild_id) VALUES (?, NULL, ?, 1, ?)",
                [userId, adventureId, guildId],
                (err) => {
                    if (err) {
                        Logger.logError("insertVote", err);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    async recordVote(userId: string, structureId: number, adventureId: number, votes: number, guildId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO votes (user_id, structure_id, adventure_id, votes, guild_id) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, adventure_id, guild_id) DO UPDATE SET votes = ?",
                [userId, structureId, adventureId, votes, guildId, votes],
                (err) => {
                    if (err) {
                        Logger.logError("recordVote", err);
                        reject(err);
                    } else resolve();
                }
            );
        });
    }

    async getVotes(guildId: string): Promise<Vote[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT user_id, structure_id, adventure_id, votes, guild_id FROM votes WHERE guild_id = ?",
                [guildId],
                (err, rows: Vote[]) => {
                    if (err) {
                        Logger.logError("getVotes", err);
                        reject(err);
                    } else resolve(rows);
                }
            );
        });
    }

    async getHistory(guildId: string): Promise<HistoryLog[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT id, guild_id, action_type, description, user, timestamp FROM history WHERE guild_id = ? ORDER BY timestamp DESC LIMIT 20",
                [guildId],
                (err, rows: HistoryLog[]) => {
                    if (err) {
                        Logger.logError("getHistory", err);
                        reject(err);
                    } else resolve(rows);
                }
            );
        });
    }

    async logHistory(guildId: string, actionType: string, description: string, user: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "INSERT INTO history (guild_id, action_type, description, user, timestamp) VALUES (?, ?, ?, ?, ?)",
                [guildId, actionType, description, user, Date.now()],
                (err) => {
                    if (err) {
                        Logger.logError("logHistory", err);
                        reject(err);
                    } else resolve();
                }
            );
        });
    }

    async getLatestAdventureId(guildId: string): Promise<number | null> {
        return new Promise((resolve, reject) => {
            this.db.get(
                "SELECT id FROM adventure WHERE guild_id = ? ORDER BY id DESC LIMIT 1",
                [guildId],
                (err, row: AdventureRow | undefined) => {
                    if (err) {
                        Logger.logError("getLatestAdventureId", err);
                        reject(err);
                    } else {
                        resolve(row?.id || null);
                    }
                }
            );
        });
    }
}
