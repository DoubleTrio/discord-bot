const Discord = require('discord.js')
const { primary } = require('../config.json')

const helpEmbed = new Discord.RichEmbed()
    .setColor(primary)
    .setTitle('ToasterBot | Commands v2')
    .addField('.trivia', 'Flex your vast knowledge by using `.trivia` or `.trivia <id>.` Look for categories with `.trivia help.`')
    .addField('.hangman', 'You and your buddies try to save a person by solving for a word. Do .hangman clash for the TTCC category!')
    .addField('.wumpus', '(WIP) - Play the classic game of Hunt the Wumpus!')   
    .addField('---------------------------------------------', '** **')
    .setFooter('Made by a French dessert')

module.exports = {
    name: 'help',
    description: 'Commands',
    aliases: ['commands'],
    execute(client, message) {
        message.channel.send(helpEmbed)
    }
}