import {GuildAudioSession, sessions} from "../../audio/sessionManager";
import {AudioPlayerStatus} from "@discordjs/voice";
import {CommandInteraction, GuildMember} from "discord.js";

export function isAudioPlaying(session: GuildAudioSession): boolean{
    const status: AudioPlayerStatus = session.player.state.status;
    return status === AudioPlayerStatus.Playing || status === AudioPlayerStatus.Buffering;
}

export function destroySession(guildId: string): void{
    const session = sessions.get(guildId)
    if(!session) return;

    if (session.disconnectTimeout) {
        clearTimeout(session.disconnectTimeout);
        session.disconnectTimeout = null;
    }

    session.player.stop();
    session.connection.destroy();
    sessions.delete(guildId);
}

export function validateConnection(interaction: CommandInteraction): {
    isValid: boolean;
    errorReason?: string;
} {
    const member = interaction.member as GuildMember
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
        return {
            isValid: false,
            errorReason: "Você precisa estar conectado a um canal de voz.",
        }
    }

    const botVoiceChannel = interaction.guild?.members.me?.voice.channel;
    if (voiceChannel.id !== botVoiceChannel?.id) {
        return {
            isValid: false,
            errorReason: "Você precisa estar no mesmo canal de voz que o bot para usar esse comando."
        };
    }

    return {isValid: true}
}