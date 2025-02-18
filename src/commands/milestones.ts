import {
    Message,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
} from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";
import { Milestone } from "../database/dbTypes";
import { parseArguments } from "../utils/commandParser";

const ENTRIES_PER_PAGE = 10;

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
        await requestMilestoneConfirmation(message, options, db, guildId);
    } else {
        await listMilestones(message, options, db, guildId);
    }
}

/**
 * Requests confirmation before setting a milestone.
 */
export async function requestMilestoneConfirmation(
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

        // **Send confirmation prompt**
        const embed = new EmbedBuilder()
            .setTitle("🏆 Confirm Milestone Setup")
            .setDescription(
                `Are you sure you want to set a milestone for **${name}**?\n\n` +
                `🔹 **Level:** ${levelNum}\n` +
                `🔹 **Required Votes:** ${votesRequired}`
            )
            .setColor(0xf1c40f);

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm_milestone_${guildId}_${name}_${levelNum}_${votesRequired}`)
            .setLabel("✅ Confirm")
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel_milestone_${guildId}`)
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

        await message.reply({ embeds: [embed], components: [actionRow] });
    } catch (error) {
        await Logger.handleError(message, "requestMilestoneConfirmation", error, "❌ Error requesting milestone setup.");
    }
}

/**
 * Handles user confirmation for milestone setup.
 */
export async function handleMilestoneInteraction(interaction: ButtonInteraction, db: TownDatabase) {
    const { customId, user, guild } = interaction;
    if (!guild) return;

    if (!customId.startsWith("confirm_milestone_") && !customId.startsWith("cancel_milestone_")) return;

    const [, action, guildId, name, level, votes] = customId.split("_");

    if (action === "cancel") {
        await interaction.reply({ content: "❌ Milestone setup canceled.", ephemeral: true });
        return;
    }

    const levelNum = parseInt(level);
    const votesRequired = parseInt(votes);

    try {
        const structure = await db.getStructureByName(guildId, name);
        if (!structure) {
            await interaction.reply({ content: `❌ Structure **${name}** not found.`, ephemeral: true });
            return;
        }

        await db.setMilestone(guildId, structure.id, levelNum, votesRequired);
        await db.logHistory(guildId, "milestone_set", `🏆 Set milestone for **${name}** (Level **${levelNum}**) to require **${votesRequired}** votes.`, user.username);
        await interaction.reply({ content: `✅ Milestone for **${name}**, Level **${levelNum}** set to require **${votesRequired}** votes.`, ephemeral: true });
    } catch (error) {
        await Logger.handleError(interaction.message, "handleMilestoneInteraction", error, "❌ Error setting milestone.");
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

    await message.reply({ embeds: [embed] });
    await db.logHistory(guildId, "milestone_list_checked", `📜 Checked milestones (Page ${pageIndex + 1})`, message.author.username);
}
