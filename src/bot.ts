import {
    Client,
    GatewayIntentBits,
    Partials,
    Interaction,
    ButtonInteraction,
} from "discord.js";
import * as dotenv from "dotenv";
import { db } from "./database";
import { registerCommands } from "./commands";
import { registerHelpCommand } from "./help";
import { handleUpgradeInteraction } from "./upgrade";

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
});

// ✅ Register Commands & Help
registerCommands(bot, db);
registerHelpCommand(bot);

// ✅ Event: Bot Ready
bot.once("ready", () => {
    console.log(`✅ Logged in as ${bot.user?.tag}`);
});

// ✅ Event: Listen for ALL interactions (buttons, slash commands, etc.)
bot.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.guild) {
        console.warn("⚠ Interaction received outside of a server.");
        return;
    }

    const guildId = interaction.guild.id;

    if (interaction.isButton()) {
        console.log(
            `🔹 Button clicked: ${interaction.customId} by ${interaction.user.tag} (Server: ${guildId})`,
        );

        if (
            interaction.customId.startsWith("confirm_upgrade_") ||
            interaction.customId.startsWith("cancel_upgrade_")
        ) {
            console.log(
                "🔧 Upgrade button detected, passing to handleUpgradeInteraction.",
            );
            await handleUpgradeInteraction(
                interaction as ButtonInteraction,
                db
            );
        } else {
            console.warn("⚠ Button clicked but no handler exists for it.");
        }
    }
});

// ✅ Event: Log warnings & errors
bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("debug", console.log);

// ✅ Start the bot
bot.login(TOKEN);
