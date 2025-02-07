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

// ✅ Updated command descriptions with latest features
const commandDescriptions: Record<string, string> = {
    add_structure: "Adds a new structure to the town. Usage: `!add_structure <name> [category]`",
    structures: "Lists all structures and their levels. Optionally filter by category. Usage: `!structures [category]`",
    check_votes: "Checks votes for a structure. Usage: `!check_votes <structure_name>`",
    upgrade: "Upgrades a structure if enough votes exist. Usage: `!upgrade <structure_name>`",
    set_milestones: "Sets milestone votes required for structure level-ups. Usage: `!set_milestones <structure_name> <votes_level_2> <votes_level_3> ...`",
    end_adventure: "Starts structure voting for selected players. Usage: `!end_adventure @players`",
    history: "Displays town history logs. Use `!history [filter]` to filter logs by `structures`, `votes`, or `milestones`.",
    categories: "Lists all available structure categories.",
};

async function sendGeneralHelp(message: Message) {
    const commandList = Object.keys(commandDescriptions)
        .map((cmd) => `• \`!${cmd}\` - ${commandDescriptions[cmd]}`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("🏛 Available Commands")
        .setDescription(commandList)
        .setColor(0x3498db)
        .setFooter({ text: "Use !help <command> for details." });

    await message.reply({ embeds: [embed] });
}

async function sendCommandHelp(message: Message, commandName: string) {
    const description = commandDescriptions[commandName];

    if (!description) {
        await message.reply(`❌ Command \`${commandName}\` not found.`);
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`📖 Help: \`!${commandName}\``)
        .setDescription(description)
        .setColor(0x3498db);

    await message.reply({ embeds: [embed] });
}
