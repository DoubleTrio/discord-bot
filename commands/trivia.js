const Discord = require('discord.js')
const fetch = require('node-fetch')
const { primary } = require('../config.json')
const triviaCategories = require('../assets/trivia/categories')
fetchTriviaQuestionAsync = async (categoryId = 1) => {

}

module.exports = {
    name: 'trivia',
    description: 'Trivia Time',
    async execute(client, message, args) {
        message.channel.send('Testing')
        console.log(triviaCategories)
    }
}