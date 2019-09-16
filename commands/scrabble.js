const Discord = require('discord.js')
const fs = require('fs')
const { primary } = require('../config.json')
const ScrabbleEvaluator = require('../models/scrabble/ScrabbleEvaluator')

const color = parseInt(primary.slice(1), 16)

const gameStates = {
    PLAYING: 'PLAYING',
    NO_USERS: 'NO_USERS',
    FINISHED: 'FINISHED',
}

module.exports = {
    name: 'scrabble',
    description: 'Scrabble',
    async execute(client, message, args) {
        if (args[0] === 'help' || args[0] === 'rules' || args[0] === 'instructions') {
            const rulesEmbed = new Discord.RichEmbed()
                .setColor(primary)
                .setTitle('Scrabble')
                .addField('**Coming soon**', 'Most likely by next week.')
                .addField('**Objective:**', '-Compete with other members to achieve the highest score for your words after 10 rounds.')
                .addField('**Details:**', '-There can only be a max of 30 players \n -There is a time limit of 20 seconds between each round. \n Words must be longer than 2 letters in order to be played.')
                .addField('**Scoring:**', '-Words values are calculated by Scrabble value of each letter multiplied by the length of the word. \n -First person that inputs a word first gets a bonus of 10 points. \n -First person that inputs the longest word (not value) also gets a bonus of 10 points. \n -Current standings can be found using the .standing(s) command during each round. \n There will be a total of 10 letters displayed each round where there is a 40%/60% chance for a vowel or consonant.')
                .addField('**Other**','-Essentially, the word will be compared to a word list containing at least 100,000 English words.')
                .attachFiles(['./assets/scrabble/pictures/s.jpg'])
                .setThumbnail('attachment://s.jpg')
            message.channel.send(rulesEmbed)
            return false
        }
        class Scrabble {
            constructor() {
               this.players = {}
               this.maxRounds = 3
               this.maxPlayers = 30
               this.round = 0 
               this.evaluator = new ScrabbleEvaluator
               this.status = gameStates.PLAYING
               this.winners = null
               this.maxScore = 0
               // carry 98 from prev round
            }

            start() {
                this.evaluator.initiate()
            }

            async gameLoop() {
                this.round++
                this.getScrabbleEmbed()
                const userWords = await this.awaitWords()
                const len = Object.keys(userWords).length
                this.updateStandings(userWords)
                this.evaluator.nextLetters()
                this.getStatus(len)
                if (this.status !== gameStates.NO_USERS) this.getStandings(len)
                if (this.status === gameStates.FINISHED) this.getWinners()
                console.log(this.players)
            }

            getWinners() {
                const pointsArray = Object.values(this.players).map(player => player.score)
                this.maxScore = Math.max(...pointsArray)
                this.winners = Object.values(this.players).filter(player => player.score === this.maxScore).map(player => `**${player.username}**`)
            }

            getStatus(len) {
                if (len === 0) {
                    this.status = gameStates.NO_USERS
                }
                else if (this.round === this.maxRounds) {
                    this.status = gameStates.FINISHED
                }
                else {
                    this.status = gameStates.PLAYING
                }
            }

            getStandings() {
                const data = {
                    color: color,
                    title: 'Standings',
                    fields: Object.values(this.players).map(p => (
                        {
                            name: `${p.username}: ${p.score} (+${p.gain}) | ${p.content}`,
                            value: '** **',
                        }
                    ))

                }
                const standingEmbed = new Discord.RichEmbed(data)
                message.channel.send(standingEmbed) 
            }

            async awaitWords() {
                const filter = m => m.content.length >= 1 && m.content.length <= 10 && m.content.match(/^[A-Z]/i)
                const allMessages = await message.channel.awaitMessages(filter, {
                    time: 15000,
                })

                const transformedMessages = allMessages.map(m => {
                    const lowerCaseWord = m.content.toLowerCase()
                    const isValidWord = this.evaluator.isValidWord(lowerCaseWord)
                    return {
                        content: lowerCaseWord,
                        id: m.author.id,
                        username: m.author.username,
                        validWord: isValidWord,
                        score: isValidWord ? this.evaluator.calculateScore(lowerCaseWord) : 0,
                    }

                }).reverse()

                const filteredMessages = transformedMessages.reduce((unique, m) => {
                    const { content, username, validWord, score, id } = m
                    return Object.keys(unique).includes(id) 
                    ? unique 
                    : {
                        ...unique,
                        [id]: {
                            content: content,
                            username: username,
                            validWord: validWord,
                            wordLength: content.length,
                            score: score
                        }
                    }
                }, {})

                return filteredMessages
            }

            updateStandings(userWords) {
                const ids = Object.keys(userWords)
                const wordLengthArray = Object.values(userWords).filter(obj => obj.validWord === true).map(obj => obj.wordLength)
                const greatestWordLength = Math.max(...wordLengthArray)
                let isLongestFound = false
                ids.forEach((id, index) => {
                    let { content, username, validWord, score, wordLength } = userWords[id]
                    if (validWord) {
                        if (index === 0) score += 10
                        if (!isLongestFound) {
                            if (wordLength === greatestWordLength) {
                                score += 10
                                isLongestFound = true
                            }
                        }
                    }

                    if (!Object.keys(this.players).includes(id)) { 
                        this.players[id] = {
                            score: score,
                            username: username,
                            content: content,
                            gain: score,
                        }
                    }
                    else {
                        this.players[id] = {
                            username: username,
                            score: this.players[id].score += score,
                            content: content,
                            gain: score,
                        }
                    }
                })
            }

            getScrabbleEmbed() {
                const data = {
                    color: color,
                    fields: [
                        {
                            name: `Turn: ${this.round}`,
                            value: '** **'
                        },
                        {
                            name: `Letters: ${this.evaluator.letters.sort().join(', ')}`,
                            value: '** **',
                        }
                    ]
                }
                const scrabbleEmbed = new Discord.RichEmbed(data)
                message.channel.send(scrabbleEmbed) 
            }
        }
        const scrabble = new Scrabble
        scrabble.start()
        for (let i = 0; i < scrabble.maxRounds; i++) {
            await scrabble.gameLoop()
            const status = scrabble.status
            if (status === gameStates.PLAYING) {
                continue
            }
            else {
                switch(status) {
                    case gameStates.FINISHED:
                        message.channel.send(`🎉 | ${scrabble.winners.join(', ')} won with the score of **${scrabble.maxScore}**!`)
                        break
                    case gameStates.NO_USERS:
                        message.channel.send('The game will now end due to inactivity.')
                        break
                    default:
                        console.log('how did someone get here...')
                }
                break
            }
        }
    }
}