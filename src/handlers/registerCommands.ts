import { Client, Message } from "discord.js";
import { TownDatabase } from "../database/db";
import {
    addStructure,
    listStructures,
    removeStructure,
    updateStructure,
    handleAddStructureInteraction,
    handleUpdateStructureInteraction
} from "../commands/structures";
import {
    handleMilestoneCommand,
    handleMilestoneInteraction,
    handleMilestonePagination
} from "../commands/milestones";
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
        upgrade: async (msg, args, db, guildId) => {
            if (args.name) {
                await requestUpgradeConfirmation(msg, args, db, guildId);
            } else {
                await msg.reply("❌ Please provide a structure name.");
            }
        },
    },
    milestone: {
        command: async (msg, args, db, guildId) => handleMilestoneCommand(msg, args, db, guildId), // ✅ Now handles both "set" and "list"
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
        } else if (!content.startsWith("town! help")) {
            await message.reply("❌ Invalid command. Use `town! help` for a list of commands.");
        }
    });

    bot.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

        console.log(`🔹 Interaction received: ${interaction.customId} by ${interaction.user.tag}`);

        // ✅ Structure Confirmation
        if (interaction.isButton()) {
            if (interaction.customId.startsWith("confirm_add_") || interaction.customId.startsWith("cancel_add_")) {
                await handleAddStructureInteraction(interaction, db);
            }
            if (interaction.customId.startsWith("confirm_update_") || interaction.customId.startsWith("cancel_update_")) {
                await handleUpdateStructureInteraction(interaction, db);
            }
            if (interaction.customId.startsWith("confirm_milestone_") || interaction.customId.startsWith("cancel_milestone_")) {
                await handleMilestoneInteraction(interaction, db); // ✅ Now correctly handling **ButtonInteractions**
            }
        }

        // ✅ Milestone Pagination
        if (interaction.isStringSelectMenu() && interaction.customId === "milestone_page_select") {
            await handleMilestonePagination(interaction, db); // ✅ Separate function for pagination
        }
    });

}
