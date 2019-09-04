const { primary } = require('../../config.json') 
const color = parseInt(primary.slice(1), 16)
module.exports = {
    title: '**Hunt the Wumpus**',
    color: color,
    fields: [
        {
            name: '**Description:**',
            value: '-The wumpus lives in a cave of 20 rooms, each leading to 3 other different romms. Shoot the wumpus with one of your 5 arrows to win.' 
        },
        {
            name: '**Hazards:**',
            value: '-Bottomless Pits - Two rooms contain these pits. If you arrive at any of these pits, you will automatically lose. \n -Bats - Two rooms contain these bats. You will be transported to another location if you arrive at their cave. Perhaps even to where the wumpus is...',
        },
        {                    
            name: '**Wumpus:**',
            value: '-The wumpus can traverse to any parts of the cave without the worry of being inflicted with hazards. However, he is usually asleep. \n -You can wake him up by shooting an arrow or moving into his room. \n -When the wumpus is awake, he can stay still or move to other parts of the vave. \n -After that, if he is where you are, you will be eaten and lose in the worst possible death',
        },
        {
            name: '**You:**',
            value: '-You can move or shoot an arrow each turn. \n --Moving:  You can move one room each turn. \n --Arrows:  5 arrows total: waste them all and you are vulnerable to the wumpus and automatically lose. \n --You can only shoot to nearby rooms. \n If the arrow hits the wumpus, you win.',
        },
        {
            name: '**Warnings:**',
            value: '-Wumpus: "You smell something terrible nearby." \n -Bat: "You hear a rustling." \n -Pit: "You feel a cold wind blowing from a nearby cavern."',
        },
    ],
}