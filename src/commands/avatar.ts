import {
    ChatInputCommandInteraction,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Pegue a foto de perfil de um usuário")
    .addUserOption((option) => option
        .setName("alvo")
        .setDescription("O usuário que você quer o avatar")
        .setRequired(false)
    );


export async function execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("alvo")
    const user = target ?? interaction.user;
    const avatarUrl = user.displayAvatarURL({ size: 4096, extension: "png", forceStatic: false})
    const avatarEmbed = new EmbedBuilder()
        .setTitle(`Avatar de ${user.username}`)
        .setImage(avatarUrl);


    const linkButton = new ButtonBuilder()
        .setLabel("Baixar imagem")
        .setStyle(ButtonStyle.Link)
        .setURL(avatarUrl);

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(linkButton)
    return interaction.reply({
        embeds: [avatarEmbed],
        components: [actionRow]
    });

}
