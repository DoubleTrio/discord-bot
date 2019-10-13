const Discord = require('discord.js')
const fetch = require('node-fetch')

// he is primarly used to decode the HTML format into a more readable text
const he = require('he')

const { primary } = require('../config.json')
const triviaCategories = require('../assets/trivia/categories')

// Function that randomly orders the array for shuffling the possible answers   
const shuffleArray = arr => arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1])

// Color is transformed into its base 10 form in order for Discord.RichEmbed() to work
const color = parseInt(primary.slice(1), 16)

// Displays all the categories and their ids
categoryData = {
    title: '`Use the category id alongside with trivia <id>`',
    color: color,
    fields: triviaCategories.map(category => (
        {
            name: `${category.interfaceId} - ${category.name}`,
            value: '** **'
        }
    )),
}

const categoryEmbed = new Discord.RichEmbed(categoryData)

// Fetches a trivia question and transforms it into a more usable data
fetchTriviaQuestionAsync = async (categoryId = 0) => {

    // 50/50 chance of being a multiple choice or true/false question
    // Usually, there is more questions in one category than another
    const type = Math.floor(Math.random() * 2) === 1 ? 'multiple' : 'boolean'

    // Link the fetch the trivia question depending on whether the user wants it to be random category or not
    const fetchLink = categoryId === 0 
        ? `https://opentdb.com/api.php?amount=1&type=${type}` 
        : `https://opentdb.com/api.php?amount=1&category=${categoryId}&type=${type}`

    const response = await fetch(fetchLink)
    const { results } = await response.json()
    let { category, question, correct_answer, incorrect_answers, difficulty } = results[0]

    // Combine the incorrect answers and correct answer and shuffle them into an array
    const shuffled_answers = shuffleArray([...incorrect_answers, correct_answer])
        .map(answer => he.decode(answer))
        
    correct_answer = he.decode(correct_answer)

    // Possible answers depending on whether it is a multiple choice or true/false
    const possible_answers = shuffled_answers.length === 2 ? ['A', 'B'] : ['A', 'B', 'C', 'D']

    const transfromedData = {
        category: category,
        question: he.decode(question),
        shuffled_answers: shuffled_answers,
        difficulty: difficulty,
        correct_answer: possible_answers[shuffled_answers.indexOf(correct_answer)],
        possible_answers: possible_answers
    }
    return transfromedData
}

module.exports = {
    name: 'trivia',
    description: 'Trivia Time',
    cooldown: 15,
    async execute(client, message, args) {
        if (args.length) {

            // DM the player the list of categories 
            if (args[0] === 'categories' || args[0] === 'help') {
                message.author.send(categoryEmbed)
                message.channel.send('A DM about categories has been sent!')
                return false
            }

            // If the player chooses a category that cannot be mapped to its id
            else if (args[0] < 0 || args[0] > 24) {
                message.channel.send(`Sorry ${message.author.username}, that category does not exist. Check by using \`.trivia help\`.`)
                return false
            } 
        }

        class Trivia {
            constructor(categoryId) {
                this.categoryId = categoryId
            }

            // Send the trivia embed, wait for players to input their answers, and determine who won
            async play() {
                const data = await fetchTriviaQuestionAsync(this.categoryId)
                const embed = this.getTriviaEmbed(data)
                message.channel.send(embed)

                const answers = await this.awaitAnswers(data.possible_answers)
                const winners = this.displayWinners(answers, data.correct_answer)

                // If there are no winners, just mention there are none
                if (!winners.length) {
                    message.channel.send('Nobody sent in the correct answer!')
                }
                
                // Otherwise, show display which players has won
                else {
                    message.channel.send(`🎉 | ${winners.join(', ')} chose the correct answer!`)
                }

                // Reveal the correct answer
                message.channel.send(`The correct answer was '${data.correct_answer}'`)         
            }

            // Returns an object containing all the players' latest answers
            async awaitAnswers(possibleAnswersArray) {

                // Filter all messages that are either 'A', 'B', 'C', or 'D' for 15 seconds
                const filter = m => possibleAnswersArray.includes(m.content.toUpperCase())
                const allMessages = await message.channel.awaitMessages(filter, {
                    time: 15000,
                })

                // Transform all the messages to only the players' id, content, and username
                const transformedMessages = allMessages.map(m => (
                    {
                        content: m.content.toUpperCase(),
                        id: m.author.id,
                        username: m.author.username
                    }
                )).reverse()
                
                // Filter to the latest answer of each player and returning this object
                const filteredMessages = transformedMessages.reduce((unique, m) => {
                    return Object.keys(unique).includes(m.id) 
                    ? unique 
                    : {
                        ...unique,
                        [m.id]: {
                            content: m.content,
                            username: m.username
                        }
                    }
                }, {})

                return filteredMessages
            }

            // Filtering out all the users that got the correct answer and mapping them into a single array
            displayWinners(answers, correct_answer) {
                const winnersArray = Object.keys(answers)
                    .filter(a => answers[a].content === correct_answer)
                    .map(winner => `**${answers[winner].username}**`)
                return winnersArray
            }

            // Using the data returned from fetchTriviaQuestionAsync(), the data is displayed to the user
            // Contains the possible answers, the question, category, and difficulty
            getTriviaEmbed(data) {
                const { question, shuffled_answers, category, difficulty, possible_answers } = data
                const triviaData = {
                    color: color,
                    title: question,
                    fields: shuffled_answers.map((answer, index) => (
                        {
                            name: `${possible_answers[index]}. ${answer}`,
                            value: index === shuffled_answers.length - 1 ? '----------------------------------------------' : '** **'  
                        }
                    )),
                    footer: {
                        text: `${category} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}` 
                    },
                }

                const triviaEmbed = new Discord.RichEmbed(triviaData)
                return triviaEmbed
            }
        }

        // Assume the user wants a random trivia question if there's no argument
        // Otherwise, map the argument to the category id to fetch the trivia question 
        let id = !args[0] 
            ? 0 
            : triviaCategories
                .filter(category => category.interfaceId === parseInt(args[0]))[0].dbId

        const trivia = new Trivia(id)
        await trivia.play()
    }
}