import { Client, Message } from "discord.js";
import { TownDatabase } from "../database/db";
import { addStructure, listStructures } from "../commands/structures";
import { setMilestones, listMilestones } from "../commands/milestones";
import { fetchHistory } from "../commands/history";
import { checkVotes } from "../commands/checkVotes";
import { requestUpgradeConfirmation } from "../commands/upgrade";
import { endAdventure } from "../commands/adventure";

type CommandFunction = (msg: Message, args: string[], db: TownDatabase, guildId: string) => Promise<void>;

const commandMap: Record<string, CommandFunction> = {
    "!add_structure": addStructure,
    "!structures": listStructures,
    "!check_votes": checkVotes,
    "!set_milestones": setMilestones,
    "!milestones": listMilestones,
    "!history": async (msg, args, db) => fetchHistory(msg, db),
    "!end_adventure": endAdventure,
    "!upgrade": async (msg, args, db, guildId) => {
        if (args.length > 0) {
            await requestUpgradeConfirmation(msg, args, db, guildId);
        } else {
            await msg.reply("❌ Please provide a structure name.");
        }
    },
};

export function registerCommands(bot: Client, db: TownDatabase) {
    bot.on("messageCreate", async (message: Message) => {
        if (message.author.bot || !message.guild) return;

        const args = message.content.trim().split(/\s+/);
        const command = args.shift()?.toLowerCase();
        const guildId = message.guild.id;

        console.log(`📢 Command received: ${command} from ${message.author.tag} in ${message.guild.name}`);

        const commandHandler = command ? commandMap[command] : undefined;

        if (commandHandler) {
            await commandHandler(message, args, db, guildId);
        }
    });
}
