import {
    Client,
    GatewayIntentBits,
    Partials,
} from "discord.js";
import * as dotenv from "dotenv";
import { TownDatabase } from "./database/db"; // ✅ Import the correct class
import { registerCommands } from "./handlers/registerCommands";
import { registerHelpCommand } from "./commands/help";
import { handleButtons } from "./handlers/handleButtons";
import { handleInteractions } from "./handlers/handleInteractions";
import { Logger } from "./utils/logger";
import { db as rawDb } from "./database/database"; // ✅ Import raw SQLite instance

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
    console.error("❌ Missing DISCORD_BOT_TOKEN in environment variables!");
    process.exit(1); // Stop execution if no token is found
}

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
});

// ✅ Create a TownDatabase instance with SQLite3
const townDb = new TownDatabase(rawDb); // ✅ Correctly wrapping the raw DB

// ✅ Register Commands & Help
registerCommands(bot, townDb);
registerHelpCommand(bot);

// ✅ Register Interaction & Button Handlers
handleInteractions(bot);
handleButtons(bot, townDb);

// ✅ Event: Bot Ready
bot.once("ready", () => {
    console.log(`✅ Logged in as ${bot.user?.tag}`);
});

// ✅ Event: Log Warnings & Errors with Centralized Logger
bot.on("warn", (warning) => Logger.logInfo(`⚠ ${warning}`));
bot.on("error", (error) => Logger.logError("Discord Client Error", error));
bot.on("debug", (debugInfo) => Logger.logInfo(`🔍 ${debugInfo}`));

// ✅ Start the Bot
bot.login(TOKEN);
