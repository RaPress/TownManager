import { Message } from "discord.js";

export class Logger {
    static logInfo(message: string): void {
        console.log(`ℹ️ [INFO] ${message}`);
    }

    static logError(context: string, error: unknown): void {
        console.error(`❌ [ERROR] ${context}:`, error);
    }

    /**
     * Handles errors by logging them and optionally sending a response to Discord.
     * @param message Discord Message (optional, if responding to a user)
     * @param context Where the error occurred (for logging)
     * @param error The error object
     * @param userFriendlyMessage (Optional) Message to send in Discord
     */
    static async handleError(
        message: Message | null,
        context: string,
        error: unknown,
        userFriendlyMessage?: string
    ): Promise<void> {
        this.logError(context, error);

        if (message) {
            if (error instanceof Error) {
                // ✅ Handle user errors (e.g., missing arguments, invalid input)
                if (error.message.includes("Missing required argument")) {
                    await message.reply(
                        `❌ Missing argument.\nUse \`!help ${message.content.split(" ")[0]}\` for correct usage.`
                    );
                    return;
                }
                if (error.message.includes("Invalid argument")) {
                    await message.reply(
                        `❌ Invalid argument.\nUse \`!help ${message.content.split(" ")[0]}\` for correct usage.`
                    );
                    return;
                }
            }

            // ✅ Default error message for unexpected errors
            await message.reply(userFriendlyMessage || "❌ An unexpected error occurred.");
        }
    }
}
