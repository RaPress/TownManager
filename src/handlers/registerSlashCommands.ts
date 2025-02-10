import { REST, Routes, Client } from "discord.js";
import * as dotenv from "dotenv";
import { CommandList } from "../commands/commandList";

dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("❌ Missing environment variables for command registration!");
    process.exit(1);
}

export const registerSlashCommands = async () => {
    const commands = CommandList.map(cmd => cmd.data.toJSON());

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    try {
        console.log("🔄 Registering Slash Commands GLOBALLY...");
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log("✅ Global Slash Commands registered successfully.");
    } catch (error) {
        console.error("❌ Error registering commands:", error);
    }
};
