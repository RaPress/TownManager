import { Message } from "discord.js";

export async function handleCommandError(message: Message, error: any) {
    if (error instanceof Error) {
        if (error.message.includes("Missing required argument")) {
            await message.reply(
                `❌ Missing argument.\nUse \`!help ${message.content.split(" ")[0]}\` for correct usage.`,
            );
        } else if (error.message.includes("Invalid argument")) {
            await message.reply(
                `❌ Invalid argument.\nUse \`!help ${message.content.split(" ")[0]}\` for correct usage.`,
            );
        } else {
            await message.reply(
                "❌ An error occurred. Check command usage or contact an admin.",
            );
        }
    }
}
