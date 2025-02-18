export function parseArguments(argsArray: string[]): Record<string, string> {
    const args: Record<string, string> = {};

    // Regular expression to match key=value pairs, supporting quotes
    const regex = /(\w+)=(".*?"|\S+)/g;

    let match;
    const joinedArgs = argsArray.join(" ");

    while ((match = regex.exec(joinedArgs)) !== null) {
        const key = match[1];
        let value = match[2];

        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1); // Remove surrounding quotes
        }

        args[key] = value;
    }

    return args;
}
