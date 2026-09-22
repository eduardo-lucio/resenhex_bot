import {AudioPlayerStatus, createAudioResource} from "@discordjs/voice";
import youtubedl from "youtube-dl-exec";
import { EmbedBuilder, Client, TextChannel } from "discord.js";
import {sessions} from "./sessionManager";

export async function playNext(guildId: string, client: Client): Promise<void>{
    const session = sessions.get(guildId);
    if(
        !session ||
        session.isProcessing ||
        session.player.state.status === AudioPlayerStatus.Playing ||
        session.player.state.status === AudioPlayerStatus.Buffering
    ) return

    if(session.currentProcess){
        session.currentProcess.kill()
        session.currentProcess = undefined
    }

    if(session.queue.length === 0){
        session.disconnectTimeout = setTimeout(()=>{
            if(session.player.state.status === "idle" && session.queue.length === 0){
                session.connection.destroy()
                sessions.delete(guildId)
            }
        }, 2 * 60 * 1000)
        return;
    }

    if(session.disconnectTimeout){
        clearTimeout(session.disconnectTimeout)
        session.disconnectTimeout = null;
    }

    session.isProcessing = true;
    const track = session.queue.shift();

    try{
        const subprocess = youtubedl.exec(track!.url, {
            output: "-",
            format: "bestaudio"
        })
        subprocess.catch(() => {});
        if(!subprocess.stdout){
            throw new Error("Não foi possível acessar a saída de áudio do processo.")
        }
        session.currentProcess = subprocess;
        const resource = createAudioResource(subprocess.stdout);
        session.player.play(resource);

        const channel = client.channels.cache.get(session.textChannelId) as TextChannel
        if(channel?.isSendable()){
            const embed = new EmbedBuilder()
                .setTitle(`🎶 Tocando agora: ${track!.title}`)
                .setURL(track!.url)
                .setThumbnail(track!.thumbnail)
                .setColor(0x57F287)
                .setDescription(`Canal: **${track!.uploader}** | Pedido por: <@${track!.requestedBy}>`);

            await channel.send({ embeds: [embed] });
        }
    }catch (e) {
            console.error("Erro ao reproduzir faixa:", e);
            return playNext(guildId, client);
    }finally {
        session.isProcessing = false;
    }
}