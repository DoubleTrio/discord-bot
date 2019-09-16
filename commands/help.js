const Discord = require('discord.js')
const { primary } = require('../config.json')

const helpEmbed = new Discord.RichEmbed()
    .setColor(primary)
    .setTitle('ToasterBot | Commands v2')
    .addField('.trivia', 'Flex your vast knowledge by using `.trivia` or `.trivia <id>.` Look for categories with `.trivia help.`')
    .addField('.hangman', 'You and your buddies try to save a person by solving for a word. Do `.hangman clash` for the TTCC category!')
    .addField('.wumpus', 'Play the classic game of Hunt the Wumpus! Do `.wumpus help` for instructions.')
    .addField('.apod', 'Get NASA\'s daily space image and their explanation!')
    .addField('.scrabble', 'Compete against others in a 5-round Scrbble-like game and earn the highest score.')
    .addField('.blackjack', 'Test your luck with Blackjack')
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