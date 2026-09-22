import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
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
    const customApiUrl = "https://urlshortenerel.vercel.app/urls/custom"
    try{
        const url = urlSchema.parse(interaction.options.getString("url"))
        if(!interaction.options.getString("customname")){
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
            if(responseJson.message){
                return interaction.reply(responseJson.message)
            }
            return interaction.reply("<"+`https://urlshortenerel.vercel.app/u/${responseJson.shortUrl}`+">")
        }else{
            const request = new Request(customApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url,
                    customName: interaction.options.getString("customname"),
                    validTime: interaction.options.getNumber("dias")
                })
            })
            const response = await fetch(request)
            const responseJson = await response.json()
            console.log(responseJson)
            if(responseJson.message){
                if(responseJson.details){
                    return interaction.reply(responseJson.details[0].message)
                }
                return interaction.reply(responseJson.message)
            }
            return interaction.reply("<"+`https://urlshortenerel.vercel.app/u/${responseJson.shortUrl}`+">")
        }
    }catch(e) {
        return interaction.reply("oi")
    }
}