import {
    Client,
    Message,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from "discord.js";

export function registerHelpCommand(bot: Client) {
    bot.on("messageCreate", async (message: Message) => {
        if (message.content.startsWith("town! help")) {
            const args = message.content.split(" ");
            const commandName = args[2];

            if (commandName) {
                await sendCommandHelp(message, commandName);
            } else {
                await sendInteractiveHelp(message);
            }
        }
    });

    bot.on("interactionCreate", async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        if (interaction.customId === "help_menu") {
            const selectedCommand = interaction.values[0];
            await sendCommandHelp(interaction, selectedCommand);
        }
    });
}

// ✅ Categorized Command List
const commandCategories: Record<string, Record<string, { description: string; usage: string }>> = {
    "🏛 General Commands": {
        help: {
            description: "Shows this help menu.",
            usage: "Usage: `town! help [command]`",
        },
        history: {
            description: "Displays town history logs.",
            usage: "Usage: `town! history [structures | votes | milestones]`",
        },
    },
    "📜 Structure Commands": {
        "structure add": {
            description: "Adds a new structure.",
            usage: "Usage: `town! structure add name=\"StructureName\" category=\"CategoryName\"`",
        },
        "structure remove": {
            description: "Removes an existing structure.",
            usage: "Usage: `town! structure remove name=\"StructureName\"`",
        },
        "structure update": {
            description: "Updates a structure's category.",
            usage: "Usage: `town! structure update name=\"StructureName\" category=\"NewCategory\"`",
        },
        "structure list": {
            description: "Lists all structures and levels.",
            usage: "Usage: `town! structure list [category]`",
        },
        "structure upgrade": {
            description: "Upgrades a structure if enough votes exist.",
            usage: "Usage: `town! structure upgrade name=\"StructureName\"`",
        },
    },
    "📊 Voting Commands": {
        "votes check": {
            description: "Checks votes for a structure.",
            usage: "Usage: `town! votes check name=\"StructureName\"`",
        },
        "adventure end": {
            description: "Ends an adventure and starts voting.",
            usage: "Usage: `town! adventure end @players`",
        },
    },
    "📏 Milestone Commands": {
        "milestones list": {
            description: "Lists milestones for structures.",
            usage: "Usage: `town! milestones list [structure_name]`",
        },
        "milestones set": {
            description: "Sets milestone votes required for leveling up.",
            usage: "Usage: `town! milestones set name=\"StructureName\" votes=\"1 2 3 4 5 6 7 8 9 10\"`",
        },
    },
};

// ✅ Sends an Interactive Dropdown Menu for Help
async function sendInteractiveHelp(message: Message) {
    const embed = new EmbedBuilder()
        .setTitle("📖 Town Manager Help")
        .setDescription("Select a command from the dropdown below to see details.")
        .setColor(0x3498db)
        .setFooter({ text: "Use town! help <command> to get help directly." });

    const menu = new StringSelectMenuBuilder()
        .setCustomId("help_menu")
        .setPlaceholder("📜 Select a command to view help")
        .addOptions(
            Object.entries(commandCategories).flatMap(([category, commands]) =>
                Object.keys(commands).map((cmd) => ({
                    label: `town! ${cmd} (${category})`,
                    description: commands[cmd].description,
                    value: cmd,
                }))
            )
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

    await message.reply({ embeds: [embed], components: [row] });
}

// ✅ Sends Detailed Help for a Specific Command
async function sendCommandHelp(target: Message | StringSelectMenuInteraction, commandName: string) {
    const commandInfo = Object.values(commandCategories)
        .flatMap((category) => Object.entries(category))
        .find(([cmd]) => cmd === commandName)?.[1];

    if (!commandInfo) {
        await sendCommandSuggestion(target, commandName);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`📖 Help: \`town! ${commandName}\``)
        .setDescription(`${commandInfo.description}\n\n${commandInfo.usage}`)
        .setColor(0x3498db);

    if (target instanceof Message) {
        await target.reply({ embeds: [embed] });
    } else {
        await target.update({ embeds: [embed], components: [] });
    }
}

// ✅ Suggest Similar Commands for Mistyped Commands
async function sendCommandSuggestion(target: Message | StringSelectMenuInteraction, invalidCommand: string) {
    const availableCommands = Object.values(commandCategories)
        .flatMap((category) => Object.keys(category));

    const closestMatch = availableCommands.find(
        (cmd) => cmd.startsWith(invalidCommand) || invalidCommand.startsWith(cmd)
    );

    const response = closestMatch
        ? `❌ Unknown command \`town! ${invalidCommand}\`. Did you mean \`town! ${closestMatch}\`?`
        : `❌ Unknown command \`town! ${invalidCommand}\`. Use \`town! help\` to see available commands.`;

    if (target instanceof Message) {
        await target.reply(response);
    } else {
        await target.update({ content: response, components: [] });
    }
}
