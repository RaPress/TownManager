import { Client, Message } from "discord.js";
import { TownDatabase } from "../database/db";
import { getCommandMap } from "../commands/getCommandMap";

export function registerCommands(bot: Client, db: TownDatabase) {
    bot.on("messageCreate", async (message: Message) => {
        if (message.author.bot || !message.guild) return;

        const args = message.content.trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();
        const guildId = message.guild.id;

        console.log(`📢 Command received: ${command} from ${message.author.tag} in ${message.guild.name}`);

        const commandMap = getCommandMap();
        const commandHandler = command ? commandMap[command] : undefined;

        if (commandHandler) {
            await commandHandler(message, args, db, guildId);
        }
    });
}
