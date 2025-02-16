export function parseArguments(argsArray: string[]): Record<string, string> {
    const args: Record<string, string> = {};

    argsArray.forEach((arg) => {
        const match = arg.match(/(\w+)="([^"]+)"/);
        if (match) {
            const [, key, value] = match;
            args[key.toLowerCase()] = value;
        }
    });

    return args;
}
