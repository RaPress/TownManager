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
        if (message.content.startsWith("!help")) {
            const args = message.content.split(" ");
            const commandName = args[1];

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
            usage: "Usage: `!help [command]`",
        },
        history: {
            description: "Displays town history logs.",
            usage: "Usage: `!history [structures | votes | milestones]`",
        },
    },
    "📜 Structure Commands": {
        add_structure: {
            description: "Adds a new structure.",
            usage: "Usage: `!add_structure <name> [category]`",
        },
        structures: {
            description: "Lists all structures and levels.",
            usage: "Usage: `!structures [category]`",
        },
        upgrade: {
            description: "Upgrades a structure if enough votes exist.",
            usage: "Usage: `!upgrade <structure_name>`",
        },
    },
    "📊 Voting Commands": {
        check_votes: {
            description: "Checks votes for a structure.",
            usage: "Usage: `!check_votes <structure_name>`",
        },
        end_adventure: {
            description: "Starts structure voting.",
            usage: "Usage: `!end_adventure @players`",
        },
    },
    "📏 Milestone Commands": {
        milestones: {
            description: "Lists milestones for structures.",
            usage: "Usage: `!milestones [structure_name]`",
        },
        set_milestones: {
            description: "Sets milestone votes required for leveling up.",
            usage: "Usage: `!set_milestones <structure_name> <votes_level_2> <votes_level_3> ...`",
        },
    },
};

// ✅ Sends an Interactive Dropdown Menu for Help
async function sendInteractiveHelp(message: Message) {
    const embed = new EmbedBuilder()
        .setTitle("📖 Town Manager Help")
        .setDescription("Select a command from the dropdown below to see details.")
        .setColor(0x3498db)
        .setFooter({ text: "Use !help <command> to get help directly." });

    const menu = new StringSelectMenuBuilder()
        .setCustomId("help_menu")
        .setPlaceholder("📜 Select a command to view help")
        .addOptions(
            Object.entries(commandCategories).flatMap(([category, commands]) =>
                Object.keys(commands).map((cmd) => ({
                    label: `!${cmd} (${category})`,
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
        .setTitle(`📖 Help: \`!${commandName}\``)
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
        ? `❌ Unknown command \`!${invalidCommand}\`. Did you mean \`!${closestMatch}\`?`
        : `❌ Unknown command \`!${invalidCommand}\`. Use \`!help\` to see available commands.`;

    if (target instanceof Message) {
        await target.reply(response);
    } else {
        await target.update({ content: response, components: [] });
    }
}
