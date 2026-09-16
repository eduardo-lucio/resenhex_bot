import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("senha")
    .setDescription("Qual a senha do online-fix?");

export async function execute(interaction: CommandInteraction) {
    return interaction.reply("`online-fix.me`");
}
