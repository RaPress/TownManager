import {
    ButtonInteraction,
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from "discord.js";
import { Database } from "sqlite3";

// ✅ Step 1: Request Upgrade Confirmation
export async function requestUpgradeConfirmation(
    message: Message,
    args: string[],
    db: Database,
) {
    const structureName = args.join(" ").trim().toLowerCase();

    db.get(
        `SELECT id, name, level, max_level FROM structures WHERE LOWER(name) = ?`,
        [structureName],
        (
            err,
            structure: {
                id: number;
                name: string;
                level: number;
                max_level: number;
            },
        ) => {
            if (err || !structure) {
                return message.reply(
                    `❌ Structure '${structureName}' not found.`,
                );
            }

            if (structure.level >= structure.max_level) {
                return message.reply(
                    `⚠ **${structure.name}** is already at max level!`,
                );
            }

            // ✅ Check if it has enough votes
            db.get(
                `SELECT votes_required FROM milestones WHERE structure_id = ? AND level = ?`,
                [structure.id, structure.level + 1],
                (err, milestone: { votes_required: number }) => {
                    if (err || !milestone) {
                        return message.reply(
                            `❌ Milestone for **${structure.name}** at Level ${structure.level + 1} is not set.`,
                        );
                    }

                    db.get(
                        `SELECT SUM(votes) AS total FROM votes WHERE structure_id = ?`,
                        [structure.id],
                        (err, result: { total: number }) => {
                            if (err) {
                                return message.reply(
                                    "❌ Database error while checking votes.",
                                );
                            }

                            const totalVotes = result?.total || 0;

                            if (totalVotes < milestone.votes_required) {
                                return message.reply(
                                    `⚠ **${structure.name}** needs **${milestone.votes_required - totalVotes}** more votes to upgrade.`,
                                );
                            }

                            // ✅ Send Confirmation Prompt with Buttons
                            const embed = new EmbedBuilder()
                                .setTitle("⚠ Upgrade Confirmation ⚠")
                                .setDescription(
                                    `Are you sure you want to upgrade **${structure.name}** from Level **${structure.level}** to Level **${structure.level + 1}**?\n\n` +
                                        `This will consume **${milestone.votes_required}** votes.`,
                                )
                                .setColor(0xf1c40f);

                            const confirmButton = new ButtonBuilder()
                                .setCustomId(`confirm_upgrade_${structure.id}`)
                                .setLabel("✅ Confirm Upgrade")
                                .setStyle(ButtonStyle.Success);

                            const cancelButton = new ButtonBuilder()
                                .setCustomId(`cancel_upgrade_${structure.id}`)
                                .setLabel("❌ Cancel")
                                .setStyle(ButtonStyle.Danger);

                            const actionRow =
                                new ActionRowBuilder<ButtonBuilder>().addComponents(
                                    confirmButton,
                                    cancelButton,
                                );

                            message.reply({
                                embeds: [embed],
                                components: [actionRow],
                            });
                        },
                    );
                },
            );
        },
    );
}

export async function handleUpgradeInteraction(
    interaction: ButtonInteraction,
    db: Database,
) {
    if (!interaction.isButton()) return;

    console.log(
        `🔹 Upgrade button clicked: ${interaction.customId} by ${interaction.user.tag}`,
    );

    const match = interaction.customId.match(
        /^(confirm_upgrade|cancel_upgrade)_(\d+)$/,
    );
    if (!match) {
        console.error("❌ Invalid button ID format:", interaction.customId);
        return interaction.reply({
            content: "❌ Invalid upgrade request.",
            ephemeral: true,
        });
    }

    const action = match[1]; // "confirm_upgrade" or "cancel_upgrade"
    const structureId = match[2]; // The actual structure ID

    console.log(`🔍 Parsed action: ${action}, Structure ID: ${structureId}`);

    if (action === "cancel_upgrade") {
        console.log("⚠ Upgrade canceled.");
        return interaction.reply({
            content: "❌ Upgrade canceled.",
            ephemeral: true,
        });
    }

    if (action === "confirm_upgrade") {
        console.log(`🛠️ Processing upgrade for Structure ID: ${structureId}`);

        try {
            await interaction.deferReply({ ephemeral: true });
        } catch (error) {
            console.error("❌ Interaction expired, cannot defer reply.");
            return;
        }

        db.get(
            `SELECT id, name, level, max_level FROM structures WHERE id = ?`,
            [structureId],
            (
                err: Error | null,
                structure: {
                    id: number;
                    name: string;
                    level: number;
                    max_level: number;
                },
            ) => {
                if (err || !structure) {
                    console.error("❌ Structure not found or DB error:", err);
                    return interaction.followUp({
                        content: "❌ Structure not found.",
                        ephemeral: true,
                    });
                }

                console.log(
                    `✅ Structure found: ${structure.name} (Level ${structure.level})`,
                );

                if (structure.level >= structure.max_level) {
                    return interaction.followUp({
                        content: `⚠ **${structure.name}** is already at max level!`,
                        ephemeral: true,
                    });
                }

                console.log(
                    `🔍 Checking required votes for next level: ${structure.level + 1}`,
                );

                db.get(
                    `SELECT votes_required FROM milestones WHERE structure_id = ? AND level = ?`,
                    [structureId, structure.level + 1],
                    (
                        err: Error | null,
                        milestone: { votes_required: number },
                    ) => {
                        if (err || !milestone) {
                            console.error("❌ Milestone not found:", err);
                            return interaction.followUp({
                                content: "❌ Milestone not set for next level.",
                                ephemeral: true,
                            });
                        }

                        console.log(
                            `✅ Milestone found: ${milestone.votes_required} votes needed.`,
                        );

                        db.get(
                            `SELECT SUM(votes) AS total FROM votes WHERE structure_id = ?`,
                            [structureId],
                            (err: Error | null, result: { total: number }) => {
                                if (err) {
                                    console.error(
                                        "❌ Error checking votes:",
                                        err,
                                    );
                                    return interaction.followUp({
                                        content: "❌ Database error.",
                                        ephemeral: true,
                                    });
                                }

                                const totalVotes = result?.total || 0;
                                console.log(
                                    `📊 Total votes available: ${totalVotes}`,
                                );

                                if (totalVotes < milestone.votes_required) {
                                    return interaction.followUp({
                                        content: `⚠ **${structure.name}** does not have enough votes to upgrade! **${milestone.votes_required - totalVotes}** more needed.`,
                                        ephemeral: true,
                                    });
                                }

                                console.log(
                                    `✅ Upgrading ${structure.name} to Level ${structure.level + 1}...`,
                                );

                                db.run(
                                    `UPDATE structures SET level = ?, last_reset_adventure = (SELECT MAX(id) FROM adventure) WHERE id = ?`,
                                    [structure.level + 1, structureId],
                                    (err: Error | null) => {
                                        if (err) {
                                            console.error(
                                                "❌ Error upgrading structure:",
                                                err,
                                            );
                                            return interaction.followUp({
                                                content:
                                                    "❌ Error upgrading structure.",
                                                ephemeral: true,
                                            });
                                        }

                                        console.log(
                                            `🎉 SUCCESS: ${structure.name} upgraded to Level ${structure.level + 1}`,
                                        );

                                        db.run(
                                            `DELETE FROM votes WHERE structure_id = ?`,
                                            [structureId],
                                        );

                                        interaction.followUp({
                                            content: `🏗 **${structure.name} has been upgraded to Level ${structure.level + 1}!** 🎉`,
                                            ephemeral: false,
                                        });
                                    },
                                );
                            },
                        );
                    },
                );
            },
        );
    }
}
