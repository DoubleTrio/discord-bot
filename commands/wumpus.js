const _ = require('lodash')
const Discord = require('discord.js')
const { primary } = require('../config.json')
const rules = require('../assets/wumpus/rules')
var fp = require('lodash/fp')

const color = parseInt(primary.slice(1), 16)
// Load method categories.
var array = require('lodash/array')
var object = require('lodash/fp/object')

const shuffleArray = arr => arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1])

const BAT = 'BAT'
const PIT = 'PIT'
const WUMPUS = 'WUMPUS'
const PLAYER = 'PLAYER'

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
                this.arrows = 5
                this.elements = [PLAYER, BAT, BAT, PIT, PIT, WUMPUS]
                this.occupiedCaves = []
                this.cave = {
                    1: [2, 3, 4], 2: [1, 5, 6], 3: [1, 7, 8], 4: [1, 9, 10], 
                    5:[2, 9, 11], 6: [2, 7, 12], 7: [3, 6, 13], 8: [3, 10, 14], 
                    9: [4, 5, 15], 10: [4, 8, 16], 11: [5, 12, 17], 12: [6, 11, 18], 
                    13: [7, 14, 18], 14: [8, 13, 19], 15: [9, 16, 17], 16: [10, 15, 19], 
                    17: [11, 20, 15], 18: [12, 13, 20], 19: [14, 16, 20], 20: [17, 18, 19]
                }
                this.arrowDistance = 1
                this.threats = {}
                this.position = null
            }

            async play() {
                this.populateCave()
                this.getWumpusEmbed()
                this.senseDanger()
            }


            getWumpusRules() {
                const wumpusRulesEmbed = new Discord.RichEmbed(rules)
                return wumpusRulesEmbed
            }

            populateCave() {
                const orderedCave = Object.keys(this.cave)
                const shuffledCave = shuffleArray(orderedCave)
                console.log(shuffledCave)
                this.elements.forEach((element, index) => {
                    const cave = shuffledCave[index]
                    this.occupiedCaves = [
                        ...this.occupiedCaves, 
                            {
                                cave: cave,
                                element: element,
                                exits: this.cave[cave]
                            }
                    ]
                })
                this.position = this.occupiedCaves.find(cave => cave.element === 'PLAYER')
                console.log(this.occupiedCaves)
            }

            getWumpusEmbed() {
                const { cave, exits } = this.position
                let threats = this.senseDanger()
                console.log(threats)
                threats = Object.values(threats).join('\n')
                console.log(threats)
                const data = {
                    color: color,
                    fields: [
                        {
                            name: 'Instructions:',
                            value: 'Type `.shoot <caveNumber>` to attempt to shoot an arrow or `.move <caveNumber>` to continue through the cave.',
                        },
                        {
                            name: '** **',
                            value: '** **',
                        },
                        {
                            name: `Current Cave: ${cave} | Rooms Visited: [] | Arrows: ${this.arrows}`,
                            value: `Leads to ${exits.join(', ')}`,
                        },
                        {
                            name: 'Threats:',
                            value: threats.length ? threats : 'None, continue through the cave...',
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

            }

            senseDanger() {
                const nonPlayerCaves = this.occupiedCaves.filter(cave => cave.element !== 'PLAYER') 
                const messages = nonPlayerCaves.reduce((unique, cave) => {
                    return !this.position.exits.includes(parseInt(cave.cave)) 
                    ? unique 
                    : {
                        ...unique,
                        [cave.element.toLowerCase()]: cave.element === BAT 
                            ? 'You hear a rustling.' 
                            : cave.element === PIT 
                            ? 'You feel a cold wind blowing from a nearby cavern.'
                            : 'You smell something terrible nearby.'
                    }
                }, {})
                return messages
            }

            move() {

            }

            shootArrow() {
            }
        }

        const wumpus = new Wumpus()
        await wumpus.play()
    }
}