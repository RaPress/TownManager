import {
    Client,
    Message,
    Interaction,
    ButtonInteraction
} from "discord.js";
import { Database } from "sqlite3";
import { startVoting, handleVote } from "./voting";
import {
    handleUpgradeInteraction,
    requestUpgradeConfirmation,
} from "./upgrade";
import {
    addStructure,
    listStructures,
    checkVotes,
} from "./structures";
import { fetchHistory } from "./history";
import { setMilestones, listMilestones } from "./milestones";

export function registerCommands(bot: Client, db: Database) {
    bot.on("messageCreate", async (message: Message) => {
        if (message.author.bot || !message.guild) return;

        const args = message.content.split(" ");
        const command = args.shift()?.toLowerCase();
        if (!command) return; // ✅ Ensure command is not undefined

        const guildId = message.guild.id;

        console.log(
            `📢 Command received: ${command} from ${message.author.tag} in ${message.guild.name}`,
        );

        await handleCommand(command, message, args, db, guildId);
    });

    bot.on("interactionCreate", async (interaction: Interaction) => {
        if (!interaction.isButton()) return;

        console.log(
            `🔹 Button clicked: ${interaction.customId} by ${interaction.user.tag}`,
        );

        await handleInteraction(interaction as ButtonInteraction, db);
    });
}

// ✅ Extracted function to handle commands
async function handleCommand(
    command: string,
    message: Message,
    args: string[],
    db: Database,
    guildId: string
) {
    const commandHandlers: Record<
        string,
        (msg: Message, args: string[], db: Database, guildId: string) => Promise<void>
    > = {
        "!add_structure": addStructure,
        "!structures": async (msg, args, db, guildId) => { await listStructures(msg, args, db); },
        "!check_votes": checkVotes,
        "!set_milestones": async (msg, args, db, guildId) => { await setMilestones(msg, args, db); },
        "!milestones": async (msg, args, db, guildId) => { await listMilestones(msg, args, db); },
        "!end_adventure": endAdventure
    };

    if (command === "!upgrade") {
        if (args.length > 0) {
            await requestUpgradeConfirmation(message, args, db, guildId);
        } else {
            message.reply("❌ Please provide a structure name.");
        }
    } else if (command === "!history") {
        await fetchHistory(message, db);
    } else {
        const handler = commandHandlers[command];
        if (handler) {
            await handler(message, args, db, guildId);
        }
    }
}

// ✅ Extracted function to handle interactions
async function handleInteraction(interaction: ButtonInteraction, db: Database) {
    if (interaction.customId.startsWith("vote_")) {
        await handleVote(interaction, db);
    } else if (
        interaction.customId.startsWith("confirm_upgrade_") ||
        interaction.customId.startsWith("cancel_upgrade_")
    ) {
        const customIdParts = interaction.customId.split("_");
        const extractedGuildId = customIdParts.length > 3 ? customIdParts[3] : null;

        await handleUpgradeInteraction(
            interaction,
            db,
            extractedGuildId || "dm"
        );
    }
}

// ✅ Extracted function to check GM role
function isUserGM(message: Message): boolean {
    const gmRole = message.guild?.roles.cache.find((r) => r.name === "GM");
    return gmRole ? message.member?.roles.cache.has(gmRole.id) ?? false : false;
}

// ✅ GM-Only Command: Start Voting after Adventure
async function endAdventure(message: Message, args: string[], db: Database, guildId: string) {
    if (!isUserGM(message)) {
        return message.reply("❌ You do not have permission to use this command.");
    }

    const mentionedPlayers = message.mentions.users.map((user) => user.id);
    if (mentionedPlayers.length === 0) {
        return message.reply("❌ You must mention players who will participate in the vote.");
    }

    await startVoting(message, mentionedPlayers, db, guildId);
}
