const Discord = require('discord.js')
const fs = require('fs')
const { primary } = require('../config.json')

// modify this with a better reg expression instead of map
const words = fs.readFileSync('./assets/words.txt').toString().split('\n').map(word => word.slice(0, word.length - 1))

const WINNER = 'WINNER'
const OUT_OF_LIVES = 'OUT_OF_LIVES'
const NO_INPUT = 'NO_INPUT'
const PLAYING = 'PLAYING'
const GUESSED = 'GUESSED'

module.exports = {
    name: 'hangman',
    description: 'Play an epic hangman game',
    async execute(client, message, args) {
        class Hangman {
            constructor(secretWord) {
                this.lives = 8
                this.availableLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
                this.lettersGuessed = []
                this.status = PLAYING
                this.secretWord = secretWord
                this.isFirstNullInput = false
                this.prevNullInput = false
                this.gameStarted = false
                this.wordGuessed = false
            }

            async play() {
                const embed = this.getHangmanEmbed()
                if (!this.isFirstNullInput) message.channel.send(embed)
                const letter = await this.awaitLetterInput()
                this.prevNullInput = this.isFirstNullInput
                this.manageLetterInput(letter)
                this.getStatus()
            }

            // private
            async awaitLetterInput() {
                const filter = m => this.availableLetters.includes(m.content.toLowerCase()) || m.content.startsWith(this.secretWord)
                const allMessages = await message.channel.awaitMessages(filter, {
                    time: 8000,
                })
                const transformedMessages = allMessages.map(m => (
                    {
                        content: m.content,
                        id: m.author.id,
                    }
                )).reverse()
                
                if (transformedMessages.map(m => m.content).includes(this.secretWord)) {
                    return GUESSED
                }

                const filteredMessages = transformedMessages.reduce((unique, m) => {
                    return Object.keys(unique).includes(m.id) 
                    ? unique 
                    : {
                        ...unique,
                        [m.id]: m.content
                    }
                }, {})
                const lettersArray = Object.values(filteredMessages)
                const randomLetter = lettersArray[Math.floor(Math.random() * lettersArray.length)]
                return typeof randomLetter === 'string' ? randomLetter.toLowerCase() : NO_INPUT
            }
            // private
            getDisplay() {
                const display = []
                for (let letter of this.secretWord) {
                    display.push(
                        this.lettersGuessed.includes(letter) || letter === ' ' 
                        ? letter
                        : '-'
                    )
                }
                return display.join('')
            }

            getStatus() {
                if (this.lives <= 0) {
                    this.status = OUT_OF_LIVES
                }
                else if (this.isFirstNullInput === true && this.prevNullInput === true) {
                    this.status = NO_INPUT
                }
                else if (this.wordGuessed === true) {
                    this.status = GUESSED
                }
                else if ([...this.secretWord].filter(letter => this.lettersGuessed.includes(letter) || letter === ' ').length === this.secretWord.length) {
                    this.status = WINNER
                }
                else {
                    this.status = PLAYING
                }
            }

            manageLetterInput(letter) {
                if (letter === NO_INPUT) {
                    if (!this.isFirstNullInput) {
                        message.channel.send('There was no input detected. If there\'s no input in 8 seconds, the game will end!')
                        this.isFirstNullInput = true
                    }
                }

                else if (letter === GUESSED) {
                    this.wordGuessed = true
                }

                else {
                    this.availableLetters = this.availableLetters.filter(l => l !== letter)
                    this.lettersGuessed.push(letter)
                    this.isFirstNullInput = false
                    if (![...this.secretWord].includes(letter)) this.lives--
                }
            }
            // private
            getHangmanEmbed() {
                const hangmanEmbed = new Discord.RichEmbed()
                    .addField(`# Lives Left: ${this.lives}`, '** **')
                    .addField(`Available Letters: ${this.availableLetters.join(' ')}`, '** **')
                    .addField(`Unavailable Letters: ${this.lettersGuessed.sort().join(' ')}`, '** **')
                    .addField(this.getDisplay(), '** **')
                    .setColor(primary)
                return hangmanEmbed
            }
        }
        message.channel.send('Debugging right now, be sure to blame Mac if the bot randomly stops working')
        randomWord = words[Math.floor(Math.random() * words.length)]
        const hangman = new Hangman(randomWord)
        console.log(randomWord)
        for (let i = 0; i < hangman.availableLetters.length - hangman.lives - 1; i++) {
            await hangman.play()
            if (hangman.status === PLAYING) {
                continue
            }
            else {
                switch(hangman.status) { 
                    case WINNER:
                        message.channel.send(`You won! The word was \`${hangman.secretWord}\`.`)
                        break
                    case GUESSED:
                        message.channel.send(`Nice job guessing! The word was \`${hangman.secretWord}\`.`)
                        break
                    case OUT_OF_LIVES: 
                        message.channel.send(`Game over, you have no more lives! The word was \`${hangman.secretWord}\`.`)
                        break
                    case NO_INPUT:
                        message.channel.send('Nobody was playing for two turns. The game has ended!')
                        break
                    default:
                        message.channel.send('Uh, Maq, you need to fix something')
                }
                break
            }
        }
    }
}