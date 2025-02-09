export function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
}

export function chunkMessage(message: string, chunkSize = 1800): string[] {
    return message.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];
}
