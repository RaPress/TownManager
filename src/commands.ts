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
        if (message.author.bot) return;
        const args = message.content.split(" ");
        const command = args.shift()?.toLowerCase();

        console.log(
            `📢 Command received: ${command} from ${message.author.tag}`,
        );

        switch (command) {
            case "!add_structure":
                await addStructure(message, args, db);
                break;
            case "!structures":
                await listStructures(message, args, db);
                break;
            case "!check_votes":
                await checkVotes(message, args, db);
                break;
            case "!upgrade":
                if (args.length > 0) {
                    await requestUpgradeConfirmation(message, args, db);
                } else {
                    message.reply("❌ Please provide a structure name.");
                }
                break;
            case "!set_milestones":
                await setMilestones(message, args, db);
                break;
            case "!milestones":
                await listMilestones(message, args, db);
                break;
            case "!end_adventure":
                await endAdventure(message, args, db);
                break;
            case "!history":
                await fetchHistory(message, db);
                break;
        }
    });

    bot.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isButton()) {
            console.log(
                `🔹 Button clicked: ${interaction.customId} by ${interaction.user.tag}`,
            );

            if (interaction.customId.startsWith("vote_")) {
                await handleVote(interaction as ButtonInteraction, db);
            } else if (
                interaction.customId.startsWith("confirm_upgrade_") ||
                interaction.customId.startsWith("cancel_upgrade_")
            ) {
                await handleUpgradeInteraction(
                    interaction as ButtonInteraction,
                    db,
                );
            }
        }
    });
}

// ✅ GM-Only Command: Start Voting after Adventure
async function endAdventure(message: Message, args: string[], db: Database) {
    const gmRole = message.guild?.roles.cache.find((r) => r.name === "GM");

    if (!gmRole || !message.member?.roles.cache.has(gmRole.id)) {
        return message.reply(
            "❌ You do not have permission to use this command.",
        );
    }

    const mentionedPlayers = message.mentions.users.map((user) => user.id);

    if (mentionedPlayers.length === 0) {
        return message.reply(
            "❌ You must mention players who will participate in the vote.",
        );
    }

    await startVoting(message, mentionedPlayers, db);
}
