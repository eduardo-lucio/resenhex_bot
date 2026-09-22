import {CommandInteraction, SlashCommandBuilder} from "discord.js";
import {sessions} from "../../audio/sessionManager";
import {destroySession, isAudioPlaying, validateConnection} from "./audioUtils";

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips tracking data')

export async function execute(interaction: CommandInteraction) {
    const guildId = interaction.guildId!;
    if(!guildId){
        return interaction.reply({content: "Esse comando só pode ser usado em servidores."})
    }

    await interaction.deferReply()

    const session = sessions.get(guildId)
    if(!session){
        return await interaction.editReply({
            content: "Não estou reproduzindo nenhuma música."
        })
    }

    const validConnection = validateConnection(interaction)
    if(!validConnection.isValid){
        return await interaction.editReply({
            content: `${validConnection.errorReason}`
        })
    }

    if(!isAudioPlaying(session) || session.queue.length === 0){
        destroySession(guildId)
        if(!isAudioPlaying(session)){
            return await interaction.editReply({ content: "Não há nenhuma música tocando. Encerrei a reprodução."})
        }
        if(session.queue.length === 0){
            return await interaction.editReply({ content: "Não há nenhuma música na fila. Encerrei a reprodução."})
        }
    }

    await interaction.editReply({ content: `Música pulada, reproduzindo agora : ${session.queue[0].title}` })
    return session.player.stop();
}