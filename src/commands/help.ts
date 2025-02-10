import {
    Client,
    CommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    SlashCommandBuilder,
    CommandInteractionOptionResolver
} from "discord.js";

/**
 * Register the help command with the bot.
 */
export function registerHelpCommand(bot: Client) {
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
            usage: "Usage: `/help [command]`",
        },
        history: {
            description: "Displays town history logs.",
            usage: "Usage: `/history`",
        },
    },
    "📜 Structure Commands": {
        add_structure: {
            description: "Adds a new structure.",
            usage: "Usage: `/add_structure name:<structure_name>`",
        },
        structures: {
            description: "Lists all structures and levels.",
            usage: "Usage: `/structures`",
        },
        upgrade: {
            description: "Upgrades a structure if enough votes exist.",
            usage: "Usage: `/upgrade structure:<structure_name>`",
        },
    },
    "📊 Voting Commands": {
        check_votes: {
            description: "Checks votes for a structure.",
            usage: "Usage: `/check_votes structure:<structure_name>`",
        },
        end_adventure: {
            description: "Starts structure voting.",
            usage: "Usage: `/end_adventure players:@players`",
        },
    },
    "📏 Milestone Commands": {
        milestones: {
            description: "Lists milestones for structures.",
            usage: "Usage: `/milestones`",
        },
        set_milestones: {
            description: "Sets milestone votes required for leveling up.",
            usage: "Usage: `/set_milestone structure_id:<id> level:<level> votes_required:<votes>`",
        },
    },
};

/**
 * Slash command to show help.
 */
export const HelpCommand = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows available commands or details about a specific command.")
        .addStringOption(option =>
            option.setName("command")
                .setDescription("Get details for a specific command")
                .setRequired(false)
        ),

    execute: async (interaction: CommandInteraction) => {
        // ✅ Fix `getString` by explicitly casting `interaction.options`
        const options = interaction.options as CommandInteractionOptionResolver;
        const commandName = options.getString("command");

        if (commandName) {
            await sendCommandHelp(interaction, commandName);
        } else {
            await sendInteractiveHelp(interaction);
        }
    }
};

/**
 * Sends an interactive dropdown menu for help.
 */
async function sendInteractiveHelp(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("📖 Town Manager Help")
        .setDescription("Select a command from the dropdown below to see details.")
        .setColor(0x3498db)
        .setFooter({ text: "Use /help command:<name> to get help directly." });

    const menu = new StringSelectMenuBuilder()
        .setCustomId("help_menu")
        .setPlaceholder("📜 Select a command to view help")
        .addOptions(
            Object.entries(commandCategories).flatMap(([category, commands]) =>
                Object.keys(commands).map((cmd) => ({
                    label: `/${cmd} (${category})`,
                    description: commands[cmd].description,
                    value: cmd,
                }))
            )
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

/**
 * Sends detailed help for a specific command.
 */
async function sendCommandHelp(target: CommandInteraction | StringSelectMenuInteraction, commandName: string) {
    const commandInfo = Object.values(commandCategories)
        .flatMap((category) => Object.entries(category))
        .find(([cmd]) => cmd === commandName)?.[1];

    if (!commandInfo) {
        await sendCommandSuggestion(target, commandName);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`📖 Help: \`/${commandName}\``)
        .setDescription(`${commandInfo.description}\n\n${commandInfo.usage}`)
        .setColor(0x3498db);

    if (target instanceof CommandInteraction) {
        await target.reply({ embeds: [embed], ephemeral: true });
    } else {
        await target.update({ embeds: [embed], components: [] });
    }
}

/**
 * Suggests similar commands if a user mistypes a command.
 */
async function sendCommandSuggestion(target: CommandInteraction | StringSelectMenuInteraction, invalidCommand: string) {
    const availableCommands = Object.values(commandCategories)
        .flatMap((category) => Object.keys(category));

    const closestMatch = availableCommands.find(
        (cmd) => cmd.startsWith(invalidCommand) || invalidCommand.startsWith(cmd)
    );

    const response = closestMatch
        ? `❌ Unknown command \`/${invalidCommand}\`. Did you mean \`/${closestMatch}\`?`
        : `❌ Unknown command \`/${invalidCommand}\`. Use \`/help\` to see available commands.`;

    if (target instanceof CommandInteraction) {
        await target.reply({ content: response, ephemeral: true });
    } else {
        await target.update({ content: response, components: [] });
    }
}
