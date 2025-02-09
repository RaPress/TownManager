export interface Structure {
    id: number;
    guildId: string;
    name: string;
}

export interface Milestone {
    id: number;
    guildId: string;
    name: string;
    value: number;
}

export interface Vote {
    id: number;
    guildId: string;
    voterId: string;
    votedFor: string;
}

export interface HistoryLog {
    id: number;
    guildId: string;
    action: string;
    timestamp: number;
}
