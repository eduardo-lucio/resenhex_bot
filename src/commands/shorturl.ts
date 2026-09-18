import {ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder} from "discord.js";
import z from "zod"
export const data = new SlashCommandBuilder()
    .setName("shorturl")
    .setDescription("Encurtar url com a API shorturl")
    .addStringOption((option)=> option
        .setName("url")
        .setDescription("URL para encurtar")
        .setRequired(true)
    )
    .addNumberOption((option)=> option
        .setName("dias")
        .setDescription("dias que a url ficará valida")
        .setMinValue(1)
        .setMaxValue(365)
        .setRequired(true)
    )
    .addStringOption((option)=> option
        .setName("customname")
        .setDescription("Adicione um nome customizado a sua URL")
        .setRequired(false)
    )

export async function execute(interaction: ChatInputCommandInteraction) {
    const urlSchema = z.string().url("Deve ser uma url")
    const apiUrl = "https://urlshortenerel.vercel.app/urls"
    try{
        const url = urlSchema.parse(interaction.options.getString("url"))
        const request = new Request(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                url,
                validTime: interaction.options.getNumber("dias")
            })
        })
        const response = await fetch(request)
        const responseJson = await response.json()
        console.log(url)
        console.log(interaction.options.getNumber("dias"))
        console.log(responseJson)
        return interaction.reply("<"+`https://urlshortenerel.vercel.app/u/${responseJson.shortUrl}`+">")
    }catch(err) {
        return interaction.reply(err.message)
    }

    return interaction.reply("`online-fix.me`");
}