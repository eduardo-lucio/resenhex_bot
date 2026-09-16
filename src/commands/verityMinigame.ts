import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    ComponentEmojiResolvable, EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";

const items = ["<:verity:1549576353509023915>", "<:cruelty:1549835983489339402>", "<:falsity:1549834709100667041>", "🍇", "🍓"]

function shuffleArray(array: string[]){
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function compareArray(arr1: string[], arr2: string[]): number {
    let result = 0;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] === arr2[i]) result ++
    }
    return result;
}

export const data = new SlashCommandBuilder()
    .setName("verity")
    .setDescription("minigame do verity");

export async function execute(interaction: CommandInteraction) {
    const secretSequence: string[] = shuffleArray(items)
    const shuffledOptions: ComponentEmojiResolvable[] = shuffleArray(secretSequence) as ComponentEmojiResolvable[]
    const buttons = shuffledOptions.map((item, index) =>
        new ButtonBuilder()
            .setCustomId(`item_${index}`)
            .setEmoji(item)
            .setStyle(ButtonStyle.Primary)
    );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)

    const response = await interaction.reply({
        content: "Escolha a ordem dos itens clicando nos botões abaixo:",
        components: [row],
        fetchReply: true,
    });
    const collector = response.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 60_000,
    });

    let currentGuess: string[] = [];
    let attemptsLeft: number = 5;
    let embedResponse = new EmbedBuilder()
        .setTitle("Verity")
        .setColor(ButtonStyle.Primary)

    collector.on("collect", async (i) => {
        const index = Number(i.customId.split("_")[1]);
        const chosenItem = shuffledOptions[index];
        currentGuess.push(chosenItem as string)
        if(currentGuess.length === 5){
            let correctAnswers = compareArray(secretSequence, currentGuess)
            if(correctAnswers !== 5){
                if(attemptsLeft === 1){
                    await i.update("voce perdeu")
                    collector.stop()
                }
                attemptsLeft--
                embedResponse.setDescription(`${correctAnswers} acertos`)
                embedResponse.setFooter({text: `${attemptsLeft} tentativas restantes`});
                embedResponse.addFields({ name:'\u200b', value: `${currentGuess.join(" ")}, ${correctAnswers} ${correctAnswers !== 1 ? "acertos" : "acerto"}`})
                currentGuess = []
                await i.update({
                    content: null,
                    embeds: [embedResponse]
                })
            }else {
                await i.update({content: `voce venceu ${correctAnswers}`});
                collector.stop()
            }
        }else{
            await i.update({content: currentGuess.join("")})
        }
    });
    console.log(`A sequencia correta é ${secretSequence}`)
}
