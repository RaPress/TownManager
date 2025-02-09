export interface Structure {
    id: number;
    guild_id: string;
    name: string;
    level: number;
    max_level: number;
    category: string;
}

export interface Milestone {
    structure_id: number;
    level: number;
    votes_required: number;
    guild_id: string;
}

export interface Vote {
    user_id: string;
    structure_id: number;
    adventure_id: number;
    votes: number;
    guild_id: string;
}

export interface HistoryLog {
    id: number;
    guild_id: string;
    action_type: string;
    description: string;
    user: string;
    timestamp: number;
}

export interface AdventureRow {
    id: number;
}
