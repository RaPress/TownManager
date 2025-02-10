import { Message, CommandInteraction, ButtonInteraction } from "discord.js";

export class Logger {
    static logInfo(message: string): void {
        console.log(`ℹ️ [INFO] ${message}`);
    }

    static logError(context: string, error: unknown): void {
        console.error(`❌ [ERROR] ${context}:`, error);
    }

    /**
     * Handles errors by logging them and optionally sending a response to Discord.
     * @param source Discord Message or Interaction (optional, if responding to a user)
     * @param context Where the error occurred (for logging)
     * @param error The error object
     * @param userFriendlyMessage (Optional) Message to send in Discord
     */
    static async handleError(
        source: Message | CommandInteraction | ButtonInteraction | null,
        context: string,
        error: unknown,
        userFriendlyMessage?: string
    ): Promise<void> {
        this.logError(context, error);

        if (!source) return;

        try {
            if (source instanceof Message) {
                await source.reply(userFriendlyMessage || "❌ An unexpected error occurred.");
            } else if (source instanceof CommandInteraction) {
                if (source.replied || source.deferred) {
                    await source.followUp({ content: userFriendlyMessage || "❌ An unexpected error occurred.", ephemeral: true });
                } else {
                    await source.reply({ content: userFriendlyMessage || "❌ An unexpected error occurred.", ephemeral: true });
                }
            }
        } catch (replyError) {
            console.error("❌ Failed to send error response:", replyError);
        }
    }
}
