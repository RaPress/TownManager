import {
    Message,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";
import { Milestone } from "../database/dbTypes";
import { parseArguments } from "../utils/commandParser";

const ENTRIES_PER_PAGE = 5;

/**
 * Handles milestone-related commands (`set`, `list`).
 */
export async function handleMilestoneCommand(
    message: Message,
    args: string[],
    db: TownDatabase,
    guildId: string
): Promise<void> {
    const parsed = parseArguments(args);
    const { action, ...options } = parsed;

    if (!action) {
        await message.reply("❌ Missing milestone action. Use `town! milestone set` or `town! milestone list`.");
        return;
    }

    if (action === "set") {
        await setMilestone(message, options, db, guildId);
    } else {
        await listMilestones(message, options, db, guildId);
    }
}

/**
 * Sets a milestone for a structure.
 */
export async function setMilestone(
    message: Message,
    options: Record<string, string>,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    const { name, level, votes } = options;
    if (!name || !level || !votes) {
        await message.reply("❌ Missing parameters. Use: `town! milestone set name=\"Structure Name\" level=3 votes=10`.");
        return;
    }

    const levelNum = parseInt(level);
    const votesRequired = parseInt(votes);
    if (isNaN(levelNum) || isNaN(votesRequired)) {
        await message.reply("❌ Level and votes must be numbers.");
        return;
    }

    try {
        const structure = await db.getStructureByName(guildId, name);
        if (!structure) {
            await message.reply(`❌ Structure **${name}** not found.`);
            return;
        }

        await db.setMilestone(guildId, structure.id, levelNum, votesRequired);
        await db.logHistory(guildId, "milestone_set", `🏆 Set milestone for **${name}** (Level **${levelNum}**) to require **${votesRequired}** votes.`, message.author.username);
        await message.reply(`✅ Milestone for **${name}**, Level **${levelNum}** set to require **${votesRequired}** votes.`);
    } catch (error) {
        await Logger.handleError(message, "setMilestone", error, "❌ Error setting milestone.");
    }
}

/**
 * Lists milestones (all or for a specific structure).
 */
export async function listMilestones(
    message: Message,
    options: Record<string, string>,
    db: TownDatabase,
    guildId: string
): Promise<void> {
    try {
        const name = options.name;
        const milestones = name
            ? await db.getMilestonesByStructure(guildId, name)
            : await db.getMilestones(guildId);

        if (!milestones.length) {
            await message.reply(name ? `📜 No milestones found for **${name}**.` : "📜 No milestones found.");
            return;
        }

        await sendMilestonesPage(message, milestones, 0, db, guildId, name);
    } catch (error) {
        await Logger.handleError(message, "listMilestones", error, "❌ Error fetching milestones.");
    }
}

/**
 * Handles pagination for milestones.
 */
export async function handleMilestoneInteraction(interaction: StringSelectMenuInteraction, db: TownDatabase) {
    if (interaction.customId !== "milestone_page_select") return;

    const guildId = interaction.guild?.id;
    if (!guildId) return await interaction.reply({ content: "❌ Unable to determine server.", ephemeral: true });

    try {
        const pageIndex = parseInt(interaction.values[0], 10);
        const structureName = interaction.message.embeds[0]?.title?.match(/for \*\*(.+?)\*\*/)?.[1];

        const milestones = structureName
            ? await db.getMilestonesByStructure(guildId, structureName)
            : await db.getMilestones(guildId);

        if (!milestones.length) return await interaction.reply({ content: "📜 No milestones found.", ephemeral: true });

        await sendMilestonesPage(interaction.message as Message, milestones, pageIndex, db, guildId, structureName);
        await interaction.deferUpdate();
    } catch (error) {
        await Logger.logError("handleMilestoneInteraction", error);
        await interaction.reply({ content: "❌ Error fetching milestones.", ephemeral: true });
    }
}

/**
 * Sends paginated milestone entries.
 */
async function sendMilestonesPage(
    message: Message,
    milestones: Milestone[],
    pageIndex: number,
    db: TownDatabase,
    guildId: string,
    structureName?: string
) {
    const totalPages = Math.ceil(milestones.length / ENTRIES_PER_PAGE);
    const formattedMilestones = milestones.slice(pageIndex * ENTRIES_PER_PAGE, (pageIndex + 1) * ENTRIES_PER_PAGE)
        .map((m, i) => `🏆 ${i + 1 + pageIndex * ENTRIES_PER_PAGE}: **${m.structure_id}** (Level ${m.level}) - **${m.votes_required} votes**`)
        .join("\n");

    const embed = new EmbedBuilder()
        .setTitle(`📜 Milestones ${structureName ? `for **${structureName}**` : ""} (Page ${pageIndex + 1} of ${totalPages})`)
        .setDescription(formattedMilestones)
        .setColor(0x3498db)
        .setFooter({ text: "Select a page below to view more milestones." });

    await message.reply({ embeds: [embed], components: totalPages > 1 ? [createPaginationMenu(totalPages)] : [] });
    await db.logHistory(guildId, "milestone_list_checked", `📜 Checked milestones (Page ${pageIndex + 1})`, message.author.username);
}

/**
 * Creates a pagination select menu.
 */
function createPaginationMenu(totalPages: number): ActionRowBuilder<StringSelectMenuBuilder> {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("milestone_page_select")
            .setPlaceholder("📜 Select a page")
            .addOptions(Array.from({ length: totalPages }, (_, i) => ({
                label: `📖 Page ${i + 1}`,
                description: `View milestones ${i * ENTRIES_PER_PAGE + 1} - ${(i + 1) * ENTRIES_PER_PAGE}`,
                value: `${i}`
            })))
    );
}
