import {
    CommandInteraction,
    SlashCommandBuilder,
    CommandInteractionOptionResolver
} from "discord.js";
import { Logger } from "../utils/logger";
import { TownDatabase } from "../database/db";
import { Milestone } from "../database/dbTypes";

/**
 * Slash command to set a new milestone for a structure.
 */
export const SetMilestoneCommand = {
    data: new SlashCommandBuilder()
        .setName("set_milestone")
        .setDescription("Sets a milestone for a structure.")
        .addIntegerOption(option =>
            option.setName("structure_id")
                .setDescription("The ID of the structure")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("level")
                .setDescription("The level of the milestone")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("votes_required")
                .setDescription("Number of votes required for this milestone")
                .setRequired(true)
        ),

    execute: async (interaction: CommandInteraction, db: TownDatabase) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
            return;
        }

        // Get parameters from the command
        const options = interaction.options as CommandInteractionOptionResolver;
        const structureId = options.getInteger("structure_id");
        const level = options.getInteger("level");
        const votesRequired = options.getInteger("votes_required");

        if (structureId === null || level === null || votesRequired === null) {
            await interaction.reply({ content: "❌ Structure ID, level, and votes are required.", ephemeral: true });
            return;
        }

        try {
            await db.setMilestone(guildId, structureId, level, votesRequired);
            await db.logHistory(
                guildId,
                "milestone_set",
                `🏆 Set milestone for Structure ID **${structureId}**, Level **${level}** to require **${votesRequired}** votes.`,
                interaction.user.username
            );

            Logger.logInfo(`🏆 Milestone set for Structure ID ${structureId}, Level ${level} in ${guildId}`);

            await interaction.reply(`✅ Milestone for Structure ID **${structureId}**, Level **${level}** set to require **${votesRequired}** votes.`);
        } catch (error) {
            await Logger.handleError(interaction, "setMilestones", error, "❌ Error setting milestone.");
        }
    }
};

/**
 * Slash command to list all milestones.
 */
export const ListMilestonesCommand = {
    data: new SlashCommandBuilder()
        .setName("milestones")
        .setDescription("Lists all milestones in the town."),

    execute: async (interaction: CommandInteraction, db: TownDatabase) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
            return;
        }

        try {
            const milestones = await db.getMilestones(guildId);

            if (!milestones || milestones.length === 0) {
                await interaction.reply("📜 No milestones found.");
                return;
            }

            const milestoneList = milestones
                .map((m: Milestone) => `🏆 Structure **${m.structure_id}** (Level ${m.level}): **${m.votes_required} votes required**`)
                .join("\n");

            await db.logHistory(
                guildId,
                "milestone_list_checked",
                `📜 Checked the milestone list`,
                interaction.user.username
            );

            Logger.logInfo(`📋 Milestones list checked by ${interaction.user.tag} in ${guildId}`);

            await interaction.reply(`📋 **Milestones List:**\n${milestoneList}`);
        } catch (error) {
            await Logger.handleError(interaction, "listMilestones", error, "❌ Error fetching milestones.");
        }
    }
};
