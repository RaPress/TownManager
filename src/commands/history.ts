import {
    Message,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from "discord.js";
import { TownDatabase } from "../database/db";
import { HistoryLog } from "../database/dbTypes";
import { Logger } from "../utils/logger";

const ENTRIES_PER_PAGE = 5;

/**
 * Fetches and displays paginated town history.
 */
export async function fetchHistory(message: Message, db: TownDatabase): Promise<void> {
    const guildId = message.guild?.id;
    if (!guildId) return sendErrorMessage(message, "❌ This command must be used in a server.");

    try {
        const history = await db.getHistory(guildId);
        if (!history.length) return sendErrorMessage(message, "📜 No history available.");

        await sendHistoryPage(message, history, 0, db, guildId);
    } catch (error) {
        await Logger.handleError(message, "fetchHistory", error, "❌ Error fetching history.");
    }
}

/**
 * Handles pagination for the history select menu.
 */
export async function handleHistoryInteraction(interaction: StringSelectMenuInteraction, db: TownDatabase) {
    if (interaction.customId !== "history_page_select") return;
    const guildId = interaction.guild?.id;
    if (!guildId) return await sendErrorMessage(interaction, "❌ Unable to determine server.", true);

    try {
        const history = await db.getHistory(guildId);
        if (!history.length) return await sendErrorMessage(interaction, "📜 No history available.", true);

        const pageIndex = parseInt(interaction.values[0], 10);
        await sendHistoryPage(interaction.message as Message, history, pageIndex, db, guildId);
        await interaction.deferUpdate();
    } catch (error) {
        await Logger.logError("handleHistoryInteraction", error);
        await sendErrorMessage(interaction, "❌ Error fetching history.", true);
    }
}

/**
 * Sends a paginated history message.
 */
async function sendHistoryPage(
    message: Message,
    history: HistoryLog[],
    pageIndex: number,
    db: TownDatabase,
    guildId: string
) {
    const totalPages = Math.ceil(history.length / ENTRIES_PER_PAGE);
    const formattedHistory = history.slice(pageIndex * ENTRIES_PER_PAGE, (pageIndex + 1) * ENTRIES_PER_PAGE)
        .map((h, i) => `${i + 1 + pageIndex * ENTRIES_PER_PAGE}️⃣ **${new Date(h.timestamp).toLocaleString()}** - ${h.action_type}: ${h.description}`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle(`📜 Town History (Page ${pageIndex + 1} of ${totalPages})`)
        .setDescription(formattedHistory)
        .setColor(0x3498db)
        .setFooter({ text: "Select a page below to view more history." });

    await message.reply({ embeds: [embed], components: totalPages > 1 ? [createPaginationMenu(totalPages)] : [] });
    await db.logHistory(guildId, "history_viewed", `📜 Viewed history (Page ${pageIndex + 1})`, message.author.username);
}

/**
 * Creates a pagination select menu.
 */
function createPaginationMenu(totalPages: number): ActionRowBuilder<StringSelectMenuBuilder> {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("history_page_select")
            .setPlaceholder("📖 Select a page")
            .addOptions(Array.from({ length: totalPages }, (_, i) => ({
                label: `📖 Page ${i + 1}`,
                description: `View history entries ${i * ENTRIES_PER_PAGE + 1} - ${(i + 1) * ENTRIES_PER_PAGE}`,
                value: `${i}`
            })))
    );
}

/**
 * Sends an error message.
 */
async function sendErrorMessage(target: Message | StringSelectMenuInteraction, content: string, ephemeral = false) {
    if (target instanceof Message) {
        await target.reply(content);
    } else {
        await target.reply({ content, ephemeral });
    }
}
