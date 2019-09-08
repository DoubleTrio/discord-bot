const Entity = require('./Entity')
module.exports = class Wumpus extends Entity {
    constructor(_cave) {
        super(_cave)
        this.isAwake = false
        this.isDead = false
    }

    move() {
        if (Math.floor(Math.random() * 4 + 1) <= 3) {
            this.cave = this.exits[Math.floor(Math.random() * this.exits.length)]
            this.exits = this.map[this.cave]
        }  
    }
}