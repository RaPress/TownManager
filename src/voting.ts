import {
    Message,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Interaction,
} from "discord.js";
import { Database } from "sqlite3";
import { logHistory } from "./history";

// ✅ Define structure type explicitly
type Structure = {
    id: number;
    name: string;
};

// ✅ Starts a new voting session
export async function startVoting(
    message: Message,
    players: string[],
    db: Database,
) {
    db.run("INSERT INTO adventure DEFAULT VALUES", function (err) {
        if (err) {
            return message.reply("❌ Database error.");
        }

        const adventureId = this.lastID; // ✅ Get the newly created adventure ID

        db.all(
            "SELECT id, name FROM structures",
            [],
            (err, structures: Structure[]) => {
                if (err || structures.length === 0) {
                    return message.reply("❌ No structures exist.");
                }

                const structureList = structures
                    .map((s: Structure, i: number) => `${i + 1}. ${s.name}`)
                    .join("\n");

                players.forEach(async (playerId) => {
                    const player = await message.client.users.fetch(playerId);
                    if (!player) return;

                    const embed = new EmbedBuilder()
                        .setTitle("🏛 Structure Voting")
                        .setDescription(
                            `Click a number to vote:\n\n${structureList}`,
                        )
                        .setColor(0x3498db);

                    const buttons = structures.map((s: Structure, i: number) =>
                        new ButtonBuilder()
                            .setCustomId(
                                `vote_${adventureId}_${playerId}_${s.id}`,
                            )
                            .setLabel(`${i + 1}`)
                            .setStyle(ButtonStyle.Primary),
                    );

                    const actionRow =
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                            buttons,
                        );

                    await player.send({
                        embeds: [embed],
                        components: [actionRow],
                    });
                });

                message.reply("📨 Sent voting messages!");
                logHistory(
                    db,
                    "Voting Started",
                    `Voting started for adventure ${adventureId} by ${message.author.tag} with players: ${players.join(", ")}`,
                );
            },
        );
    });
}

// ✅ Handles votes when players click a button
export async function handleVote(interaction: Interaction, db: Database) {
    if (!interaction.isButton()) return;

    console.log(
        `🗳️ Vote button clicked: ${interaction.customId} by ${interaction.user.tag}`,
    );

    // ✅ Immediately acknowledge the interaction
    await interaction.deferReply({ ephemeral: true });

    // ✅ Extract values from button ID
    const [_, adventureId, userId, structureId] =
        interaction.customId.split("_");

    console.log(
        `Extracted IDs -> Adventure: ${adventureId}, User: ${userId}, Structure: ${structureId}`,
    );

    if (!adventureId || !userId || !structureId) {
        console.error("❌ Invalid button ID format:", interaction.customId);
        return interaction.followUp({
            content: "❌ Invalid vote button.",
            ephemeral: true,
        });
    }

    if (interaction.user.id !== userId) {
        console.warn(
            `⚠️ User ${interaction.user.tag} tried to vote but is not allowed.`,
        );
        return interaction.followUp({
            content: "❌ You are not allowed to vote in this session.",
            ephemeral: true,
        });
    }

    // ✅ Check if user has already voted in this adventure
    db.get(
        "SELECT structure_id FROM votes WHERE user_id = ? AND adventure_id = ?",
        [userId, adventureId],
        (err, row) => {
            if (err) {
                console.error("❌ Database error:", err);
                return interaction.followUp({
                    content: "❌ Database error.",
                    ephemeral: true,
                });
            }

            if (row) {
                console.log(
                    `🔄 Updating vote for ${interaction.user.tag}: ${structureId}`,
                );
                db.run(
                    "UPDATE votes SET structure_id = ? WHERE user_id = ? AND adventure_id = ?",
                    [structureId, userId, adventureId],
                    (err) => {
                        if (err) {
                            console.error("❌ Error updating vote:", err);
                            return interaction.followUp({
                                content: "❌ Error updating vote.",
                                ephemeral: true,
                            });
                        }

                        console.log(
                            "✅ Vote successfully updated in the database.",
                        );

                        db.get<{ name: string }>(
                            "SELECT name FROM structures WHERE id = ?",
                            [structureId],
                            (err, row) => {
                                if (err || !row) {
                                    console.error(
                                        "❌ Error fetching structure name:",
                                        err,
                                    );
                                    return interaction.followUp({
                                        content:
                                            "❌ Could not find structure name.",
                                        ephemeral: true,
                                    });
                                }

                                logHistory(
                                    db,
                                    "Vote Updated",
                                    `${interaction.user.tag} changed vote to ${row.name} in adventure ${adventureId}`,
                                );

                                interaction.followUp({
                                    content: `🔄 Vote changed to **${row.name}**!`,
                                    ephemeral: true,
                                });
                            },
                        );
                    },
                );
            } else {
                console.log(
                    `✅ Registering new vote for ${interaction.user.tag}: ${structureId}`,
                );

                db.run(
                    "INSERT INTO votes (user_id, structure_id, adventure_id) VALUES (?, ?, ?)",
                    [userId, structureId, adventureId],
                    (err) => {
                        if (err) {
                            console.error("❌ Error registering vote:", err);
                            return interaction.followUp({
                                content: "❌ Error registering vote.",
                                ephemeral: true,
                            });
                        }

                        console.log(
                            "✅ Vote successfully inserted into the database.",
                        );

                        db.get<{ name: string }>(
                            "SELECT name FROM structures WHERE id = ?",
                            [structureId],
                            (err, row) => {
                                if (err || !row) {
                                    console.error(
                                        "❌ Error fetching structure name:",
                                        err,
                                    );
                                    return interaction.followUp({
                                        content:
                                            "❌ Could not find structure name.",
                                        ephemeral: true,
                                    });
                                }

                                logHistory(
                                    db,
                                    "Vote Registered",
                                    `${interaction.user.tag} voted for ${row.name} in adventure ${adventureId}`,
                                );

                                interaction.followUp({
                                    content: `✅ Vote registered for **${row.name}**!`,
                                    ephemeral: true,
                                });
                            },
                        );
                    },
                );
            }
        },
    );
}
