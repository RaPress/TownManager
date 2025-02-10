import { REST, Routes } from "discord.js";
import * as dotenv from "dotenv";
import { CommandList } from "../commands/commandList"; // List of Slash Commands

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error("❌ Missing environment variables for command registration!");
    process.exit(1);
}

export const registerSlashCommands = async () => {
    const commands = CommandList.map((cmd) => cmd.data.toJSON()); // Convert commands to Discord API format

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    try {
        console.log("🔄 Registering Slash Commands...");
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log("✅ Slash Commands registered successfully.");
    } catch (error) {
        console.error("❌ Error registering commands:", error);
    }
};
