import { Message } from "discord.js";
import { TownDatabase } from "../database/db";
import { addStructure, listStructures } from "./structures";
import { setMilestones, listMilestones } from "./milestones";
import { fetchHistory } from "./history";
import { checkVotes } from "./checkVotes";
import { requestUpgradeConfirmation } from "./upgrade";
import { endAdventure } from "./adventure";

// Define a command function type
type CommandFunction = (msg: Message, args: string[], db: TownDatabase, guildId: string) => Promise<void>;

/**
 * Returns a map of all available bot commands.
 */
export function getCommandMap(): Record<string, CommandFunction> {
    return {
        "!add_structure": addStructure,
        "!structures": listStructures,
        "!check_votes": checkVotes,
        "!set_milestones": setMilestones,
        "!milestones": listMilestones,
        "!end_adventure": endAdventure,
        "!history": async (msg: Message, args: string[], db: TownDatabase) => {
            await fetchHistory(msg, db);
        },
        "!upgrade": async (msg: Message, args: string[], db: TownDatabase, guildId: string) => {
            if (args.length > 0) {
                await requestUpgradeConfirmation(msg, args, db, guildId);
            } else {
                await msg.reply("❌ Please provide a structure name.");
            }
        },
    };
}
