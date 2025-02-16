import { Client, Message } from "discord.js";
import { TownDatabase } from "../database/db";
import { addStructure, listStructures, removeStructure, updateStructure } from "../commands/structures";
import { setMilestone, listMilestones } from "../commands/milestones";
import { fetchHistory } from "../commands/history";
import { checkVotes } from "../commands/checkVotes";
import { requestUpgradeConfirmation } from "../commands/upgrade";
import { endAdventure } from "../commands/adventure";
import { parseArguments } from "../utils/commandParser";

type CommandFunction = (msg: Message, args: Record<string, string>, db: TownDatabase, guildId: string) => Promise<void>;

const commandMap: Record<string, Record<string, CommandFunction>> = {
    structure: {
        add: addStructure,
        remove: removeStructure,
        update: updateStructure,
        list: async (msg, args, db, guildId) => listStructures(msg, args, db, guildId),
    },
    milestone: {
        set: setMilestone,
        list: async (msg, args, db, guildId) => listMilestones(msg, args, db, guildId),
    },
    history: {
        show: async (msg, args, db) => fetchHistory(msg, db),
    },
    vote: {
        check: checkVotes,
    },
    adventure: {
        end: endAdventure,
    },
    upgrade: {
        confirm: async (msg, args, db, guildId) => {
            if (args.name) {
                await requestUpgradeConfirmation(msg, args, db, guildId);
            } else {
                await msg.reply("❌ Please provide a structure name.");
            }
        },
    },
};

export function registerCommands(bot: Client, db: TownDatabase) {
    bot.on("messageCreate", async (message: Message) => {
        if (message.author.bot || !message.guild) return;

        const content = message.content.trim();
        if (!content.startsWith("town!")) return;

        const argsArray = content.split(/\s+/).slice(1);
        const subcommand = argsArray.shift()?.toLowerCase();
        const action = argsArray.shift()?.toLowerCase();
        const args = parseArguments(argsArray);
        const guildId = message.guild.id;

        console.log(`📢 Command received: ${subcommand} ${action || ""} from ${message.author.tag} in ${message.guild.name}`);

        if (subcommand && action && commandMap[subcommand]?.[action]) {
            await commandMap[subcommand][action](message, args, db, guildId);
        } else {
            await message.reply("❌ Invalid command. Use `town! help` for a list of commands.");
        }
    });
}
