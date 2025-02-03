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

const commandDescriptions: Record<string, string> = {
    add_structure: "Adds a new structure to the town.",
    structures: "Lists all structures and their levels.",
    check_votes: "Checks votes for a structure.",
    upgrade: "Upgrades a structure if enough votes exist.",
    end_adventure: "Starts structure voting for selected players.",
};

async function sendGeneralHelp(message: Message) {
    const commandList = Object.keys(commandDescriptions)
        .map((cmd) => `• \`!${cmd}\` - ${commandDescriptions[cmd]}`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle("Available Commands")
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
        .setTitle(`Help: \`!${commandName}\``)
        .setDescription(description)
        .setColor(0x3498db);

    await message.reply({ embeds: [embed] });
}
