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
            1: [2, 3, 4], 2: [1, 5, 6], 3: [1, 7, 8], 4: [1, 9, 10], 
            5:[2, 9, 11], 6: [2, 7, 12], 7: [3, 6, 13], 8: [3, 10, 14], 
            9: [4, 5, 15], 10: [4, 8, 16], 11: [5, 12, 17], 12: [6, 11, 18], 
            13: [7, 14, 18], 14: [8, 13, 19], 15: [9, 16, 17], 16: [10, 15, 19], 
            17: [11, 20, 15], 18: [12, 13, 20], 19: [14, 16, 20], 20: [17, 18, 19]
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