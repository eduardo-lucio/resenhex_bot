import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {sessions} from "../../audio/sessionManager";
import {destroySession, validateConnection} from "./audioUtils";

export const data = new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Encerra a reprodução atual")

export async function execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if(!guildId) {
        return interaction.reply({ content: "Comando executável apenas em servidores."})
    }

    const session = sessions.get(guildId)
    if(!session){
        return interaction.reply({content: "Não há nenhuma música tocando no momento."})
    }

    const validConnection = validateConnection(interaction)
    if(!validConnection.isValid){
        return await interaction.editReply({
            content: `${validConnection.errorReason}`
        })
    }

    destroySession(guildId)

    return interaction.reply({content: "Reprodução encerrada"})
}