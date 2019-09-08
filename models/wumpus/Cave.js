// Elements in the game
const BAT = 'BAT'
const PIT = 'PIT'
const WUMPUS = 'WUMPUS'
const PLAYER = 'PLAYER'

warningMessages = {
    BAT: 'You hear a rustling.',
    PIT: 'You feel a cold wind blowing from a nearby cavern.',
    WUMPUS: 'You smell something terrible nearby.',
}

const shuffleArray = arr => arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1])

const populateCave = map => {
    const elements = [PLAYER, BAT, BAT, PIT, PIT, WUMPUS]
    const orderedCave = Object.keys(map)
    const shuffledCave = shuffleArray(orderedCave)
    let prevArray = []
    elements.forEach((element, index) => {
        const cave = shuffledCave[index]
        prevArray = [
            ...prevArray, 
                {
                    cave: parseInt(cave),
                    element: element,
                    exits: map[cave]
                }
        ]
    })
        return prevArray
    }

module.exports = class Cave {
    constructor() {
        this.map = {
            1: [2, 5, 8], 2: [1, 3, 10], 3: [2, 4, 12], 4: [3, 5, 14], 
            5: [1, 4, 6], 6: [5, 7, 15], 7: [6, 8, 17], 8: [1, 7, 11], 
            9: [10, 12, 19], 10: [2, 9, 11], 11: [8, 10, 20], 12: [3, 9, 13], 
            13: [12, 14, 18], 14: [4, 13, 15], 15: [6, 14, 16], 16: [15, 17, 18], 
            17: [7, 16, 20], 18: [13, 16, 19], 19: [9, 18, 20], 20: [11, 17, 19]
        }
        this.occupiedCaves = populateCave(this.map)
    }

    getElementLocation(element) {
        return this.occupiedCaves.find(cave => cave.element === element).cave
    }

    updateWumpusPosition(wumpusObj) {
        this.occupiedCaves = this.occupiedCaves.map(obj => obj.element === wumpusObj.element ? wumpusObj : obj)
    }
}