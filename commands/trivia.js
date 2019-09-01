const Discord = require('discord.js')
const fetch = require('node-fetch')
const he = require('he')
const { primary } = require('../config.json')
const triviaCategories = require('../assets/trivia/categories')

const color = parseInt(primary.slice(1), 16)
const shuffleArray = arr => arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1])

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
fetchTriviaQuestionAsync = async (categoryId = 0) => {
    console.log(categoryId)
    const type = Math.floor(Math.random() * 2) === 1 ? 'multiple' : 'boolean'
    const fetchLink = categoryId === 0 
        ? `https://opentdb.com/api.php?amount=1&type=${type}` 
        : `https://opentdb.com/api.php?amount=1&category=${categoryId}&type=${type}`
    const response = await fetch(fetchLink)
    const { results } = await response.json()
    let { category, question, correct_answer, incorrect_answers, difficulty } = results[0]
    const shuffled_answers = shuffleArray([...incorrect_answers, correct_answer]).map(answer => he.decode(answer))
    correct_answer = he.decode(correct_answer)
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
    async execute(client, message, args) {
        if (args.length > 0) {
            console.log(args)
            if (args[0] === 'categories' || args[0] === 'help') {
                message.author.send(categoryEmbed)
                return false
            }
            else if (args[0] < 0 || args[0] > 24) {
                message.channel.send(`Sorry ${message.author.username}, that category does not exist. Check by using \`.trivia help\`.`)
                return false
            }
        }

        class Trivia {
            constructor(categoryId) {
                this.categoryId = categoryId
            }
            async play() {
                const data = await fetchTriviaQuestionAsync(this.categoryId)
                console.log(data)

                const embed = this.getTriviaEmbed(data)
                message.channel.send(embed)

                const answers = await this.awaitAnswers(data.possible_answers)
                console.log(answers)
                const winners = this.displayWinners(answers, data.correct_answer)
                if (!winners.length) {
                    message.channel.send('Nobody sent in the correct answer!')
                }
                else {
                    message.channel.send(`🎉 | ${winners.join(', ')} chose the correct answer!`)
                }
                message.channel.send(`The answer was '${data.correct_answer}'`)         
            }

            async awaitAnswers(possibleAnswersArray) {
                const filter = m => possibleAnswersArray.includes(m.content.toUpperCase())
                const allMessages = await message.channel.awaitMessages(filter, {
                    time: 8000,
                })
                const transformedMessages = allMessages.map(m => (
                    {
                        content: m.content.toUpperCase(),
                        id: m.author.id,
                        username: m.author.username
                    }
                )).reverse()
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
            displayWinners(answers, correct_answer) {
                const winnersArray = Object.keys(answers).filter(a => answers[a].content === correct_answer).map(winner => `**${answers[winner].username}**`)
                return winnersArray
            }

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
        let id = !args[0] ? 0 : triviaCategories.filter(category => category.interfaceId === parseInt(args[0]))[0].dbId
        const trivia = new Trivia(id)
        await trivia.play()
    }
}