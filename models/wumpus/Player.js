const Entity = require('./Entity')

const BAT = 'BAT'
const PIT = 'PIT'
const WUMPUS = 'WUMPUS'
const PLAYER = 'PLAYER'

module.exports = class Player extends Entity {
    constructor(_cave) {
        super(_cave)
        this.arrows = 5
        this.threats = []
        this.caveVisited = [_cave]
        this.isAlive = true
        this.triggeredElement = false
    }

    move(newCave) {
        this.triggeredElement = false
        this.cave = newCave
        const e = this.checkTriggeredThreats()
        if (e) {
            this.triggeredElement = e.element
        }

        this.addVisitedCave(newCave)
        this.exits = this.map[newCave]
    }

    shootArrow(newCave, wumpusCave) {
        this.arrows--
        this.move(this.cave)
        return newCave === wumpusCave ? true : false
    }

    addVisitedCave(cave) {
        if (!this.caveVisited.includes(cave)) this.caveVisited.push(cave)
    }

    senseThreats(occupiedCaves) {
        const allThreats = occupiedCaves.filter(cave => this.exits.includes(parseInt(cave.cave)) && cave.element !== 'PLAYER')
        this.threats = allThreats.reduce((group, c) => {
            const name = c.element
            const combineCaveThreats = group.find(e => e.element === c.element) || { threat: [] }
            const filteredGroup = group.filter(e => e.element !== c.element)
            return [
                ...filteredGroup,
                {
                    element: name,
                    threat: [...combineCaveThreats.threat, c.cave],
                    message: warningMessages[name]
                
                }
            ]
        }, [])
    }

    checkTriggeredThreats() {
        const triggered = this.threats.find(t => t.threat.includes(this.cave) && t.element !== 'PLAYER') || false
        return triggered
    }
}