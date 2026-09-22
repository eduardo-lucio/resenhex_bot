import { Client } from "discord.js";
import {deployCommands} from "./deploy-commands";
import {commands} from "./commands";

const client = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages", "GuildVoiceStates"],
});

client.once("ready", async () => {
    console.log("Discord bot is ready! 🤖");
    for (const guild of client.guilds.cache.values()) {
        await deployCommands({ guildId: guild.id });
    }
});

client.on("guildCreate", async (guild) => {
    await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const { commandName } = interaction;
    if (commands[commandName as keyof typeof commands]) {
        await commands[commandName as keyof typeof commands].execute(interaction);
    }
});
client.login(process.env.DISCORD_TOKEN);