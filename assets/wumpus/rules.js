const { primary } = require('../../config.json') 
const color = parseInt(primary.slice(1), 16)
module.exports = {
    title: '**Hunt the Wumpus**',
    color: color,
    fields: [
        {
            name: '**Description:**',
            value: '-The wumpus lives in a cave of 20 rooms. Each room has 3 tunnels to other rooms.' 
        },
        {
            name: '**Hazards:**',
            value: '-Bottomless pits - Two rooms have bottomless pits in them. If you go there, you fall into the pit (& lose)! \n -Super bats - Two other rooms have super bats. If you go there, a bat grabs you and takes you to some other room at random.',
        },
        {                    
            name: '**Wumpus:**',
            value: '-The wumpus is not bothered by hazards. (He has sucker feet and isctoo big for a bat to lift.) Usually he is asleep. \n -Two things wake him up: your shooting an arrow, or your entering his room. \n -If the wumpus wakes, he moves one room or stays still. \n -After that, if he is where you are, he eats you up and you lose!',
        },
        {
            name: '**You:**',
            value: '-Each turn you may move or shoot a crooked arrow. \n --Moving:  You can move one room (through one tunnel). \n --Arrows:  You have 5 arrows.  You lose when you run out. \n --You can only shoot to nearby rooms. \n If the arrow hits the wumpus, you win.',
        },
        {
            name: '**Warnings:**',
            value: '-Wumpus:  "You smell something terrible nearby." \n -Bat:  "You hear a rustling." \n -Pit:  "You feel a cold wind blowing from a nearby cavern."',
        },
    ],
}