const { nasa_api } = require('../config.json')
const Discord = require('discord.js')
const { primary } = require('../config.json')
const fetch = require('node-fetch')
console.log('ready?')
const fetchApodImage = async () => {
    const reponse = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${nasa_api}`)
    const results = await reponse.json()
    console.log(results)
    return results
}

module.exports = {
    name: 'apod',
    description: 'Search for movies',
    aliases: ['space'],
    async execute(client, message) {
        const { copyright, date, explanation, hdurl, title, url } = await fetchApodImage()
        const spaceEmbed = new Discord.RichEmbed()
            .setAuthor(`${typeof copyright === 'string' ? copyright + ' ': ''}${date}`)
            .addField(title, `${explanation.slice(0, 1024) || '** **'}`)
            .setImage(url)
            .setFooter('🌕')
            .setColor('#1D2951')
        if (explanation.length > 1024) {
            spaceEmbed.addField('** **', explanation.slice(1024))
        }
        message.channel.send(spaceEmbed)
    }
}