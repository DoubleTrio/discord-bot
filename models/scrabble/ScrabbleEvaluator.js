const fs = require('fs')
const words = fs.readFileSync('./assets/scrabble/words_alpha.txt').toString().split('\n').map(word => word.slice(0, word.length - 1)).filter(word => word.length >= 3 && word.length <= 10)
const shuffleArray = arr => arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1])

module.exports = class ScrabbleEvaluator {
    constructor() {
        this.letterValues = {
            a: 1, b: 3,
            c: 3, d: 2,
            e: 1, f: 4,
            g: 2, h: 4,
            i: 1, j: 8,
            k: 5, l: 1,
            m: 3, n: 1,
            o: 1, p: 3,
            q: 10, r: 1,
            s: 1, t: 1,
            u: 1, v: 4,
            w: 4, x: 8,
            y: 4, z: 10
        }
        this.availableLetters = 'aaaaaaaaabbccddddeeeeeeeeeeeeffggghhiiiiiiiiijkllllmmnnnnnnooooooooppqrrrrrrssssttttttuuuuvvwwxyyz'.split('')
        this.letters = null
        this.from = 0
        this.to = 10
    }

    initiate() {
        this.availableLetters = shuffleArray(this.availableLetters)
        this.letters = this.availableLetters.slice(0, 10)
    }

    isValidWord(word) {
        const availableWord = words.includes(word)
        const letterDistribution = this.letters.reduce((unique, letter) => {
            return Object.keys(unique).includes(letter)
                ? {
                    ...unique,
                    [letter]: unique[letter] += 1
                } 
                : {
                    ...unique,
                    [letter]: 1,
                }
        }, {})

        for (let letter of word) {
            if (Object.keys(letterDistribution).includes(letter)) {
                letterDistribution[letter] -= 1
            }

            else {
                letterDistribution[letter] = -1
            }
        }
        console.log(letterDistribution)
        return Object.values(letterDistribution).every(letterVal => letterVal >= 0) && availableWord
    }

    calculateScore(word) {
        let score = 0
        for (let letter of word) {
            score += this.letterValues[letter]
        }
        
        score *= word.length
        return score
    }

    nextLetters() {
        this.to += 10
        this.from += 10
        this.letters = this.availableLetters.slice(this.from, this.to)
    }

}