import { Client, Message, EmbedBuilder } from "discord.js";

export function registerHelpCommand(bot: Client) {
    bot.on("messageCreate", async (message: Message) => {
        if (message.content.startsWith("!help")) {
            const args = message.content.split(" ");
            const commandName = args[1];

            if (commandName) {
                await sendCommandHelp(message, commandName);
            } else {
                await sendGeneralHelp(message);
            }
        }
    });
}

// ✅ Updated command descriptions to separate usage on a new indented line
const commandDescriptions: Record<string, { description: string; usage: string }> = {
    add_structure: {
        description: "Adds a new structure to the town.",
        usage: "Usage: `!add_structure <name> [category]`"
    },
    structures: {
        description: "Lists all structures and their levels. Optionally filter by category.",
        usage: "Usage: `!structures [category]`"
    },
    check_votes: {
        description: "Checks votes for a structure.",
        usage: "Usage: `!check_votes <structure_name>`"
    },
    upgrade: {
        description: "Upgrades a structure if enough votes exist.",
        usage: "Usage: `!upgrade <structure_name>`"
    },
    milestones: {
        description: "Lists milestone votes required for structure level-ups.",
        usage: "Usage:\n  • `!milestones` → Lists all structure milestones.\n  • `!milestones <structure_name>` → Shows votes required per level."
    },
    set_milestones: {
        description: "Sets milestone vote requirements for leveling up a structure.",
        usage: "Usage: `!set_milestones <structure_name> <votes_level_2> <votes_level_3> ...`"
    },
    end_adventure: {
        description: "Starts structure voting for selected players.",
        usage: "Usage: `!end_adventure @players`"
    },
    history: {
        description: "Displays town history logs. Filter logs by type.",
        usage: "Usage: `!history [structures | votes | milestones]`"
    },
    categories: {
        description: "Lists all available structure categories.",
        usage: "Usage: `!categories`"
    },
};

async function sendGeneralHelp(message: Message) {
    const commandList = Object.entries(commandDescriptions)
        .map(([cmd, info]) => `• \`!${cmd}\` - ${info.description}\n  ${info.usage}`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("🏛 Available Commands")
        .setDescription(commandList)
        .setColor(0x3498db)
        .setFooter({ text: "Use !help <command> for details." });

    await message.reply({ embeds: [embed] });
}

async function sendCommandHelp(message: Message, commandName: string) {
    const commandInfo = commandDescriptions[commandName];

    if (!commandInfo) {
        await message.reply(`❌ Command \`${commandName}\` not found.`);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`📖 Help: \`!${commandName}\``)
        .setDescription(`${commandInfo.description}\n\n${commandInfo.usage}`)
        .setColor(0x3498db);

    await message.reply({ embeds: [embed] });
}
