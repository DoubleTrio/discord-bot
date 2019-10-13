const Discord = require('discord.js')
const { primary, wordnik } = require('../config.json')
const fetch = require('node-fetch')

const color = parseInt(primary.slice(1), 16)

const fetchDailyWordAsync = async () => {
    const reponse = await fetch(`https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=${wordnik}`)
    const results = await reponse.json()
    console.log(results)
    return results
}

module.exports = {
    name: 'word',
    description: 'Daily word of the day',
    aliases: ['dailyword'],
    async execute(client, message) {
        let { pdd, word, definitions, examples } = await fetchDailyWordAsync()
        definitions = definitions.map((def, index) => (
            {
                name: `Definition ${index + 1}:`,
                value: `\n${def.text}`,
                // \nSource:\n${def.source}
            }
        ))
        
        examples = examples.map((example, index) => (
            {
                name: `Example ${index + 1}:`,
                value: `${example.text}`,
                // \nSource:\n${example.title}`
            }
        ))

        const data = {
            color,
            title: `${word} ${pdd}`,
            fields: [...definitions, ...examples]
        }

        const wordEmbed = new Discord.RichEmbed(data)
        message.channel.send(wordEmbed)
    }
}