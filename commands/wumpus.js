/* 
TODO:
- Implement the shootArrow() method
- Encounter threats while moving to other parts of the cave
- Handle bad input
- State management of the game
- Clean up and refactor code, perhaps by turning each elements in the game into a class

Extras:
- Add edges if possible
- Implement the map of the cave system
*/

const _ = require('lodash')
const Discord = require('discord.js')
const { primary } = require('../config.json')
const rules = require('../assets/wumpus/rules')

const map = new Discord.Attachment('../assets/wumpus/map/map.png')

const color = parseInt(primary.slice(1), 16)

const shuffleArray = arr => arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1])

// Elements in the game
const BAT = 'BAT'
const PIT = 'PIT'
const WUMPUS = 'WUMPUS'
const PLAYER = 'PLAYER'

// Handling user inputs
const OUT_OF_TIME = 'OUT_OF_TIME'
const NONEXISTENT = 'NONEXISTENT'
const VALID = 'VALID'

// Game states
const KILLED_BY_WUMPUS = 'KILLED_BY_WUMPUS'
const PIT_DEATH = 'PIT_DEATH'
const WIN = 'WIN'

module.exports = {
    name: 'wumpus',
    description: 'Play Hunt the Wumpus!',
    async execute(client, message, args) {
        if (args[0] === 'help' || args[0] === 'rules') {
            const embed = new Discord.RichEmbed(rules)
            message.author.send(embed)
            message.channel.send('DM on wumpus has been sent!')
            return false
        }
        class Wumpus {
            constructor(object) {
                this.gameStarted = false
                this.arrows = 5
                this.elements = [PLAYER, BAT, BAT, BAT, BAT, BAT, PIT, PIT, PIT, WUMPUS, WUMPUS, WUMPUS, WUMPUS]
                this.occupiedCaves = []
                this.cave = {
                    1: [2, 3, 4], 2: [1, 5, 6], 3: [1, 7, 8], 4: [1, 9, 10], 
                    5:[2, 9, 11], 6: [2, 7, 12], 7: [3, 6, 13], 8: [3, 10, 14], 
                    9: [4, 5, 15], 10: [4, 8, 16], 11: [5, 12, 17], 12: [6, 11, 18], 
                    13: [7, 14, 18], 14: [8, 13, 19], 15: [9, 16, 17], 16: [10, 15, 19], 
                    17: [11, 20, 15], 18: [12, 13, 20], 19: [14, 16, 20], 20: [17, 18, 19]
                }
                this.roomsVisited = []
                this.wumpusIsAwake = false
                this.threats = []
                this.position = null
                this.warningMessages = {
                    BAT: 'You hear a rustling.',
                    PIT: 'You feel a cold wind blowing from a nearby cavern.',
                    WUMPUS: 'You smell something terrible nearby.',
                }
            }

            async play() {
                if (!this.gameStarted) {
                    this.populateCave()
                    this.gameStarted = true
                }
                this.senseDanger()
                this.getWumpusEmbed()
                console.log(this.threats)
                let input = await this.awaitInput()
                const inputState = this.validateInput(input)
                console.log(this.position)
                // Manage bad input later...
                if (inputState === OUT_OF_TIME) {
                    message.channel.send('30 seconds have passed! Hunt the Wumpus will now end.')
                    return false
                }
                else if (inputState === NONEXISTENT) {
                    message.channel.send('The cave does not exist! Please try again.')
                    return false
                }

                input.command === '.move' 
                ? this.move(input.cave)
                : this.shootArrow(input.cave) 

                console.log(this.position)
            }


            getWumpusRules() {
                const wumpusRulesEmbed = new Discord.RichEmbed(rules)
                return wumpusRulesEmbed
            }

            populateCave() {
                const orderedCave = Object.keys(this.cave)
                const shuffledCave = shuffleArray(orderedCave)
                this.elements.forEach((element, index) => {
                    const cave = shuffledCave[index]
                    this.occupiedCaves = [
                        ...this.occupiedCaves, 
                            {
                                cave: parseInt(cave),
                                element: element,
                                exits: this.cave[cave]
                            }
                    ]
                })
                this.position = this.occupiedCaves.find(cave => cave.element === PLAYER)
                this.roomsVisited.push(this.position.cave)
                this.occupiedCaves = this.occupiedCaves.filter(cave => cave.element !== PLAYER)
            }

            getWumpusEmbed() {
                const { cave, exits } = this.position
                const threatMessages = this.threats.map(t => t.message).join('\n')
                const data = {
                    color: color,
                    fields: [         
                        {
                            name: `Current Cave: ${cave} | Rooms Visited: ${this.roomsVisited.join(', ')} | Arrows: ${this.arrows}`,
                            value: `Leads to ${exits.join(', ')}`,
                        },
                        {
                            name: 'Threats:',
                            value: threatMessages.length ? threatMessages : 'None, continue through the cave...',
                        },
                    ]
                }
                const wumpusEmbed = new Discord.RichEmbed(data)
                message.channel.send(wumpusEmbed)
            }

            getStatus() {

            }

            async awaitInput() {
                // give the user a max of 20 seconds to decide their action
                // can probably use regex here to shorten code
                const filter = m => m.author.id === message.author.id && (m.content.startsWith('.shoot') || m.content.startsWith('.move'))
                try {
                    const m = await message.channel.awaitMessages(filter, 
                        {
                            time: 10000,
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
                    return transformedMessage[0]
                }

                catch (error) {
                    return OUT_OF_TIME
                }
                

            }

            validateInput(input) {
                const inputState = input === OUT_OF_TIME 
                    ? OUT_OF_TIME 
                    : this.position.exits.includes(input.cave) 
                        ? VALID 
                        : NONEXISTENT
                return inputState
            }

            senseDanger() {
                const allThreats = this.occupiedCaves.filter(cave => this.position.exits.includes(parseInt(cave.cave)) && cave.element !== PLAYER)
                console.log(allThreats)
                this.threats = allThreats.reduce((group, c) => {
                    const name = c.element
                    const combineCaveThreats = group.find(e => e.element === c.element) || { threat: [] }
                    const filteredGroup = group.filter(e => e.element !== c.element)
                    return [
                        ...filteredGroup,
                        {
                            element: name,
                            threat: [...combineCaveThreats.threat, c.cave],
                            message: this.warningMessages[name]
                        
                        }
                    ]
                }, [])
            }

            move(cave) {
                this.position = { cave: cave, exits: this.cave[cave] }
                if (!this.roomsVisited.includes(cave)) this.roomsVisited.push(cave)
            }

            shootArrow() {
            }
        }

        const wumpus = new Wumpus()
        for (let i = 0; i < 3; i++) {
            await wumpus.play()
        }
    }
}