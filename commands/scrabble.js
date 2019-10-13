const Discord = require('discord.js')
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
    aliases: ['s'],
    async execute(client, message, args) {
        if (args[0] === 'help' || args[0] === 'rules' || args[0] === 'instructions') {
            const rulesEmbed = new Discord.RichEmbed()
                .setColor(primary)
                .setTitle('Scrabble')
                .addField('**Coming soon**', 'Most likely by next week.')
                .addField('**Objective:**', '-Compete with other members to achieve the highest score for your words after 10 rounds.')
                .addField('**Details:**', '-There can only be a max of 30 players \n -There is a time limit of 20 seconds between each round. \n Words must be longer than 2 letters in order to be played.')
                .addField('**Scoring:**', '-Words values are calculated by Scrabble value of each letter multiplied by the length of the word. \n -Applies when there 1 < players \n--First person that inputs a word first gets a bonus of 10 points. \n--First person that inputs the longest word (not value) also gets a bonus of 10 points. \n There will be a total of 10 letters displayed each round where the letters are scrambled based on the letter distribution on Scrabble.')
                .addField('**Other**','-Essentially, the word will be compared to a word list containing at least 100,000 English words.')
                .attachFiles(['./assets/scrabble/pictures/s.jpg'])
                .setThumbnail('attachment://s.jpg')
            message.channel.send(rulesEmbed)
            return false
        }
        class Scrabble {
            constructor() {
               this.players = {}
               this.maxRounds = 8
               this.maxPlayers = 30
               this.round = 0 
               this.evaluator = new ScrabbleEvaluator
               this.status = gameStates.PLAYING
               this.winners = null
               this.maxScore = 0
               this.isLongestFound = false
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
            }

            getWinners() {
                const pointsArray = Object.values(this.players).map(player => player.score)
                this.maxScore = Math.max(...pointsArray)
                this.winners = Object.values(this.players).filter(player => player.score === this.maxScore).map(player => `**${player.username}**`)
            }

            getStatus(len) {
                if (!len) {
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
                let filter = m => m.content.length >= 1 && m.content.length <= 10 && m.content.match(/^[a-z]+$/)
                let options = {
                    time: 20000,
                }

                if (args[0] === 'single' || args[0] === 'solo') {
                    options = {
                        ...options,
                        max: 1,
                    } 
                    filter = m => m.content.length >= 1 && m.content.length <= 10 && m.content.match(/^[a-z]+$/) && m.author.id === message.author.id
                }

                const allMessages = await message.channel.awaitMessages(filter, options)

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
                const ids = Object.keys(userWords).reverse()
                const wordLengthArray = Object.values(userWords).filter(obj => obj.validWord === true).map(obj => obj.wordLength)
                const greatestWordLength = Math.max(...wordLengthArray)
                this.isLongestFound = false
                ids.forEach((id, index) => {
                    let { content, username, validWord, score, wordLength } = userWords[id]
                    console.log(this.isLongestFound, greatestWordLength, wordLength)
                    if (validWord && Object.keys(this.players).length > 1) {
                        if (index === 0) score += 10
                        if (!this.isLongestFound) {
                            if (wordLength === greatestWordLength) {
                                score += 10
                                this.isLongestFound = true
                            }
                        }
                    }

                    const isAlreadyPlaying = Object.keys(this.players).includes(id)
                    this.players[id] = {
                        score: isAlreadyPlaying ? this.players[id].score + score : score,
                        username: username,
                        content: content,
                        gain: score,
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
                        message.channel.send(`🎉 | ${scrabble.winners.join(', ')} achieved a score of **${scrabble.maxScore}**!`)
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