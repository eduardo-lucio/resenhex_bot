import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { ChildProcess } from "child_process";

export interface Track {
    title: string;
    url: string;
    thumbnail: string | null;
    uploader: string;
    requestedBy: string;
}

export interface GuildAudioSession {
    player: AudioPlayer;
    connection: VoiceConnection;
    disconnectTimeout: NodeJS.Timeout | null;
    queue: Track[];
    currentProcess?: ChildProcess;
    textChannelId: string;
    isProcessing: boolean;
}

export const sessions = new Map<string, GuildAudioSession>();