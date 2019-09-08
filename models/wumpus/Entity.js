module.exports = class Entity {
    constructor(cave) {
        this._cave = cave
        this.map = {
            1: [2, 3, 4], 2: [1, 5, 6], 3: [1, 7, 8], 4: [1, 9, 10], 
            5:[2, 9, 11], 6: [2, 7, 12], 7: [3, 6, 13], 8: [3, 10, 14], 
            9: [4, 5, 15], 10: [4, 8, 16], 11: [5, 12, 17], 12: [6, 11, 18], 
            13: [7, 14, 18], 14: [8, 13, 19], 15: [9, 16, 17], 16: [10, 15, 19], 
            17: [11, 20, 15], 18: [12, 13, 20], 19: [14, 16, 20], 20: [17, 18, 19]
        }
        this.exits = this.map[cave]
    }

    get cave() {
        return this._cave
    }
    set cave(cave) {
        this._cave = cave
    }
}