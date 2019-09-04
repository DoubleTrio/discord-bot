const Discord = require('discord.js')
const fs = require('fs')
const { primary } = require('../config.json')

// modify this with a better reg expression instead of map
const words = fs.readFileSync('./assets/hangman/words.txt').toString().split('\n').map(word => word.slice(0, word.length - 1))
const clash = fs.readFileSync('./assets/hangman/clash.txt').toString().split('\n').map(word => word.slice(0, word.length - 1))

// Constants for the game state of Hangman
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
                this.wordGuessed = false
            }

            // Handles the entire game by letting the players to input a letter and calling methods to handle the logic of the game 
            async play() {
                const embed = this.getHangmanEmbed()

                // Send hangman embed if the user has not missed a turn
                // Otherwise, reduce the amount of spam by letting player use the previous embed
                if (!this.isFirstNullInput) message.channel.send(embed)

                const letter = await this.awaitLetterInput()

                // Saving whether a valid input is detected for state managing
                this.prevNullInput = this.isFirstNullInput

                this.manageLetterInput(letter)
                this.getStatus()
            }

            // Await all user inputs and filter all messages that contain valid letters and select one of the letter
            async awaitLetterInput() {

                // Allow the players to guess the word as well as letter guesses
                // If any players enter a repeated letter, their input will be ignored to prevent the game from being abused to continue forever
                const filter = m => this.availableLetters.includes(m.content.toLowerCase()) || m.content.toLowerCase().startsWith(this.secretWord)

                // Wait 8 seconds for an input
                const allMessages = await message.channel.awaitMessages(filter, {
                    time: 8000,
                })
                 
                // The only important aspects are what the text message says and the id of the players
                // id - Used to filter out the latest input of each player so that they only have one guess
                // content - The letter itself 
                const transformedMessages = allMessages.map(m => (
                    {
                        content: m.content,
                        id: m.author.id,
                    }
                )).reverse()

                // End the method call if any of the players guess the word and return the state
                // This can be modified to prevent players from inputting multiple guesses AND inputting a letter
                if (transformedMessages.map(m => m.content.toLowerCase()).includes(this.secretWord)) return GUESSED

                // End the method call if there's no input
                if (!transformedMessages.length) return NO_INPUT

                // Otherwise, filter all messages to each player's letter they inputted
                const filteredMessages = transformedMessages.reduce((unique, m) => {
                    return Object.keys(unique).includes(m.id) 
                    ? unique 
                    : {
                        ...unique,
                        [m.id]: m.content
                    }
                }, {})

                // Get the array of letters from each player
                const lettersArray = Object.values(filteredMessages)

                // Randomly choose a letter and return it
                const randomLetter = lettersArray[Math.floor(Math.random() * lettersArray.length)]
                return randomLetter.toLowerCase()
            }

            // Return the display of the secret word
            // Example: engine would be displayed as '------' assuming no letters has been guessed
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

            // At the end of each turn determine the status of the game
            getStatus() {
                if (this.lives <= 0) {
                    this.status = OUT_OF_LIVES
                }

                // Occurs if the players miss their turns twice in a row
                else if (this.isFirstNullInput === true && this.prevNullInput === true) {
                    this.status = NO_INPUT
                }

                // Occurs if one of the players guessed the word
                else if (this.wordGuessed === true) {
                    this.status = GUESSED
                }

                // Occurs if all the letters have been guessed
                else if ([...this.secretWord].filter(letter => this.lettersGuessed.includes(letter) || letter === ' ').length === this.secretWord.length) {
                    this.status = WINNER
                }

                // Otherwise, assume the game is still running
                else {
                    this.status = PLAYING
                }
            }

            // Handle the logic after the letter has been returned
            manageLetterInput(letter) {

                // Occurs if there's no letter to manage
                // Continue playing if it's the player's first time missing a turn
                if (letter === NO_INPUT) {
                    if (!this.isFirstNullInput) {
                        message.channel.send('There was no input detected. If there\'s no input in 8 seconds, the game will end!')
                        this.isFirstNullInput = true
                    }
                }

                else if (letter === GUESSED) {
                    this.wordGuessed = true
                    this.isFirstNullInput = false
                }

                // Otherwise, remove the letter from the available letters and them to the letters guessed
                else {
                    this.availableLetters = this.availableLetters.filter(l => l !== letter)
                    this.lettersGuessed.push(letter)
                    this.isFirstNullInput = false

                    // If the letter is not in the secret word, remove a life
                    if (![...this.secretWord].includes(letter)) this.lives--
                }
            }

            // Display that everyone will see each turn when playing hangman 
            getHangmanEmbed() {
                const hangmanEmbed = new Discord.RichEmbed()
                    .addField(`# Lives Left: ${this.lives}`, '** **')
                    .addField(`Available Letters: ${this.availableLetters.join(' ')}`, '** **')
                    .addField(`Letters Guessed: ${this.lettersGuessed.sort().join(' ')}`, '** **')
                    .addField(this.getDisplay(), '** **')
                    .setColor(primary)
                return hangmanEmbed
            }
        }
        
        // Choose a random word and start the game
        randomWord = args[0] === 'clash' ? clash[Math.floor(Math.random() * clash.length)] : words[Math.floor(Math.random() * words.length)]
        const hangman = new Hangman(randomWord)
        console.log(randomWord)

        // Play the game for the maximum mount of turns possible
        for (let i = 0; i < 23; i++) {
            await hangman.play()
            // Determining whether to end the game based on the status
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
                        message.channel.send('Uh, Maq, you need to fix something. How the heck did status get this value.')
                }
                break
            }
        }
    }
}