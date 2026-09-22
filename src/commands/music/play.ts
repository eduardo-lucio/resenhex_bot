import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
    PermissionFlagsBits
} from "discord.js";
import {
    createAudioPlayer,
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    AudioPlayerStatus
} from "@discordjs/voice";
import youtubedl from "youtube-dl-exec";
import z from "zod";
import {sessions, Track} from "../../audio/sessionManager";
import {playNext} from "../../audio/playerService";
import {destroySession, validateConnection} from "./audioUtils";

export const data = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Toque uma música ou pesquise pelo YouTube")
    .addStringOption((option) =>
        option
            .setName("link")
            .setDescription("Link do YouTube ou termo de pesquisa")
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const botMember = interaction.guild?.members.me;
    if (!botMember) {
        return interaction.reply({
            content: "Não foi possível carregar as informações do bot.", ephemeral: true
        });
    }

    const guildId = interaction.guildId!;
    if(!guildId){
        return interaction.reply({content: "Esse comando só pode ser usado em servidores"})
    }

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;
    let existingSession = sessions.get(guildId);
    if (!voiceChannel) {
        return interaction.reply({
            content: "Você precisa estar conectado a um canal de voz.",
        })
    }

    if(!existingSession) {

        const permissions = voiceChannel.permissionsFor(botMember);
        if (!permissions.has(PermissionFlagsBits.Speak)) {
            return await interaction.reply({
                content: "Não possuo permissão para falar neste canal de voz.",
                ephemeral: true
            });
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });

        if (botMember.voice.serverMute) {
            setTimeout(() => {
                if (botMember.voice.serverMute) {
                    connection.destroy();
                    sessions.delete(guildId);
                }
            }, 2 * 60 * 1000);
            return await interaction.reply({
                content: "Não foi possível reproduzir o áudio, estou silenciado no servidor."
            });
        }

        await interaction.deferReply();
        await interaction.editReply({content: "Conectando ao canal de voz..."});

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
        } catch (error) {
            connection.destroy();
            return await interaction.editReply({content: "A conexão com o canal de voz expirou."});
        }

        const player = createAudioPlayer();
        connection.subscribe(player);

        existingSession = {
            player,
            connection,
            disconnectTimeout: null,
            queue: [],
            textChannelId: interaction.channelId,
            isProcessing: false
        }

        sessions.set(guildId, existingSession)

        player.on("stateChange", (oldState, newState) => {
            console.log(`Status do áudio: ${oldState.status} ➡️ ${newState.status}`);
            if (newState.status === "idle") {
                playNext(guildId, interaction.client);
            }
        });

        if (existingSession?.disconnectTimeout) {
            clearTimeout(existingSession.disconnectTimeout);
            existingSession.disconnectTimeout = null;
        }

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
                ]);
            } catch {
                destroySession(guildId)
                if (interaction.channel?.isSendable()) {
                    await interaction.channel.send("Fui desconectado do canal de voz. Reprodução encerrada.");
                }
            }
        });
    }else{
        await interaction.deferReply();
        const validConnection = validateConnection(interaction)
        if(!validConnection.isValid){
            return await interaction.editReply({
                content: `${validConnection.errorReason}`
            })
        }
    }

    const audioUrl = interaction.options.getString("link", true);
    const isUrl = z.url().safeParse(audioUrl).success;
    const searchQuery = isUrl ? audioUrl : `ytsearch1:${audioUrl}`;

    await interaction.editReply({ content: "Buscando e processando áudio..." });

    try {
        const info = await youtubedl(searchQuery, {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true
        });

        const videoData = (info as any).entries ? (info as any).entries[0] : info;
        if (!videoData) {
            return await interaction.editReply({ content: "Nenhum resultado encontrado." });
        }

        const newTrack: Track = {
            title: videoData.title,
            url: videoData.webpage_url,
            thumbnail: videoData.thumbnail,
            uploader: videoData.uploader,
            requestedBy: interaction.user.id
        }

        const isCurrentlyPlaying =
            existingSession.player.state.status === AudioPlayerStatus.Playing ||
            existingSession.player.state.status === AudioPlayerStatus.Buffering ||
            existingSession.isProcessing ||
            existingSession.queue.length > 0;

        existingSession.queue.push(newTrack);
        if(isCurrentlyPlaying){
            const queueEmbed = new EmbedBuilder()
                .setTitle(`Adicionado à fila (#${existingSession.queue.length})`)
                .setDescription(`[${newTrack.title}](${newTrack.url})`)
            await interaction.editReply({ embeds: [queueEmbed]})
        }else{
            await interaction.editReply({ content: `Carregando **${newTrack.title}**...` });
        }

        await playNext(guildId, interaction.client);

    } catch (e){
        console.error(e);
        await interaction.editReply({ content: "Erro ao obter dados do vídeo." });
    }
}