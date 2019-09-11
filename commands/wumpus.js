/* 
Extras:
- Add edges if possible
- Implement the map of the cave system
*/

//  /**
//   * @param userInfo Information about the user.
//   * @param userInfo.name The name of the user.
//   * @param userInfo.email The email of the user.
//   */
const Player = require('../models/wumpus/Player')
const Wumpus = require('../models/wumpus/Wumpus')
const Cave = require('../models/wumpus/Cave')

const _ = require('lodash')
const Discord = require('discord.js')
const { primary } = require('../config.json')
const rules = require('../assets/wumpus/rules')

const map = new Discord.Attachment('../assets/wumpus/map/map.png')

const color = parseInt(primary.slice(1), 16)

// Elements in the game
const BAT = 'BAT'
const PIT = 'PIT'
const WUMPUS = 'WUMPUS'
const PLAYER = 'PLAYER'

// Handling user inputs
const inputStates = {
    OUT_OF_TIME: 'OUT_OF_TIME',
    NONEXISTENT: 'NONEXISTENT',
    VALID: 'VALID',
}

const gameStates = {
    KILLED_BY_WUMPUS: 'KILLED_BY_WUMPUS',
    PIT_DEATH: 'PIT_DEATH',
    OUT_OF_TIME: 'OUT_OF_TIME',
    PLAYING: 'PLAYING',
    WIN: 'WIN',
    NO_ARROWS: 'NO_ARROWS',
    WUMPUS_MOVED: 'WUMPUS_MOVED'
}

module.exports = {
    name: 'wumpus',
    aliases: ['w', 'hunthewumpus'],
    cooldown: 15,
    description: 'Play Hunt the Wumpus!',
    async execute(client, message, args) {
        if (args[0] === 'help' || args[0] === 'rules' || args[0] === 'instructions') {
            const embed = new Discord.RichEmbed(rules)
            message.author.send(embed)
            message.channel.send('DM on wumpus has been sent!')
            return false
        }

        class HuntTheWumpus {
            constructor() {
                this.gameStarted = false
                this.status = gameStates.PLAYING
                this.cave = new Cave
                this.player = new Player(this.cave.getElementLocation(PLAYER))
                this.wumpus = new Wumpus(this.cave.getElementLocation(WUMPUS))
            }

            async start() { 
                this.player.senseThreats(this.cave.occupiedCaves)
                console.log(this.cave.threats)
            }

            async gameLoop() {
                console.log(this.cave.occupiedCaves)
                this.getWumpusEmbed(this.player)
                const input = await this.awaitInput()
                if (input.command === '.move') {
                    this.player.move(input.cave)
                    if (this.player.triggeredElement === BAT) {
                        const batPositions = this.cave.occupiedCaves.filter(c => c.element === BAT).map(c => c.cave)
                        const possiblePositions = _.difference(Object.keys(this.cave.map).map(num => parseInt(num)), batPositions)
                        const randomPosition = possiblePositions[Math.floor(Math.random() * possiblePositions.length)]
                        this.player.move(randomPosition, this.cave.occupiedCaves)
                        message.channel.send(`🦇 | The mysterious bats transported you to cave ${randomPosition}.`)
                        // this.getGameState()
                        this.player.senseThreats(this.cave.occupiedCaves)
                    }  
                }
                else if (input.command === '.shoot') {
                    const isWumpusKilled = this.player.shootArrow(input.cave, this.wumpus.cave)
                    if (isWumpusKilled) {
                        this.wumpus.isDead = true
                    }
                    else {
                        message.channel.send('➼ | Blasted! Your arrow has missed!')
                        if (!this.wumpus.isAwake) message.channel.send('The Wumpus has awoken from the cluttering of your arrow missing.')
                        this.wumpus.isAwake = true   
                    }
                }

                if (this.wumpus.isAwake) {
                    this.wumpus.move()
                    const updatedWumpusObj = {
                        cave: this.wumpus.cave,
                        exits: this.wumpus.exits,
                        element: WUMPUS,
                    }
                    this.cave.updateWumpusPosition(updatedWumpusObj)
                }

                this.getGameState()
                this.player.senseThreats(this.cave.occupiedCaves)
            }

            getGameState() {
                if (this.player.triggeredElement === PIT) {
                    this.status = gameStates.PIT_DEATH
                }
                else if (this.wumpus.willKillPlayer(this.player.cave)) {
                    this.status = gameStates.WUMPUS_MOVED
                }
                else if (this.player.triggeredElement === WUMPUS) {
                    this.status = gameStates.KILLED_BY_WUMPUS
                }
                else if (this.player.arrows <= 0) {
                    this.status = gameStates.NO_ARROWS
                } 
                else if (this.wumpus.isDead) {
                    this.status = gameStates.WIN
                }
            }

            getWumpusEmbed(playerClass) {
                const { cave, exits, threats, arrows, caveVisited } = playerClass
                const threatMessages = threats.map(t => t.message).join('\n')
                const data = {
                    color: color,
                    fields: [         
                        {
                            name: `Current Cave: ${cave} | Rooms Visited: ${caveVisited.sort((a, b) => a - b).join(', ')} | Arrows: ${arrows}`,
                            value: `Leads to ${exits.join(', ')}`,
                        },
                        {
                            name: 'Threats:',
                            value: threatMessages.length ? threatMessages : 'None, continue through the cave...',
                        },
                    ],
                    file: 'assets/wumpus/map/map.png',
                    thumbnail: {
                        url: 'attachment://map.png'
                    },
                }
                const wumpusEmbed = new Discord.RichEmbed(data)
                message.channel.send(wumpusEmbed)
            }

            async awaitInput() {
                // give the user a max of 20 seconds to decide their action
                // can probably use regex here to shorten code
                const filter = m => m.author.id === message.author.id && (m.content.startsWith('.shoot') || m.content.startsWith('.move'))
                try {
                    while (true) {
                        const m = await message.channel.awaitMessages(filter, 
                            {
                                time: 20000,
                                max: 1,
                                errors: ['time'],
                            }
                        )
                        
                        const transformedMessage = m.map(input => {
                            const argument = input.content.split(/ +/)
                            return {
                                command: argument[0],
                                cave: parseInt(argument[1]),
                            }
                        })
                        const inputType = this.validateInput(transformedMessage[0])
                        if (inputType === inputStates.NONEXISTENT) {
                            message.channel.send('Invalid cave or cannot be reached this turn, try again.')
                            continue
                        }
                        return transformedMessage[0]
                    }
                }

                catch (error) {
                    this.status = inputStates.OUT_OF_TIME
                    return inputStates.OUT_OF_TIME
                }
            }

            validateInput(input) {
                const { OUT_OF_TIME, VALID, NONEXISTENT } = inputStates
                const inputState = input === OUT_OF_TIME 
                    ? OUT_OF_TIME 
                    : this.player.exits.includes(input.cave) 
                        ? VALID 
                        : NONEXISTENT
                return inputState
            }
        }

        const huntTheWumpus = new HuntTheWumpus
        await huntTheWumpus.start()
        for (let i = 0; i < 99; i++) {
            await huntTheWumpus.gameLoop()
            if (huntTheWumpus.status === gameStates.PLAYING) {
                continue
            }
            else {
                switch(huntTheWumpus.status) {
                    case gameStates.PIT_DEATH:
                        message.channel.send('Woooosh. You have fallen into an endless pit to your horrible death.')
                        break
                    case gameStates.KILLED_BY_WUMPUS:
                        message.channel.send('You unknowingly walk into the Wumpus\'s cave and become its feast.')
                        break
                    case gameStates.WUMPUS_MOVED:
                        message.channel.send('The Wumpus walks into your cave and slaughters you.')
                        break
                    case gameStates.WIN:
                        message.channel.send('🎉 | You have slain the Wumpus and won! The kingdom rewards you with a magical toaster!')
                        break
                    case gameStates.OUT_OF_TIME:
                        message.channel.send('You wait too long until the Wumpus wakes up and discovers you in a defenseless position')
                        break
                    case gameStates.NO_ARROWS:
                        message.channel.send('Hopelessness arise as you shoot your last arrow and miss. Suddenly, a particular beast arrives behind you...')
                        break
                    default:
                        console.log('How the heck did someone get here...')
                }
                break
            } 
        }
    }
}