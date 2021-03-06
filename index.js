const fs = require('fs')
const Discord = require('discord.js')
const { prefix, token } = require('./config.json')

const client = new Discord.Client()
client.commands = new Discord.Collection()

const getCurrentTime = () => {
	const date = new Date
	let hours = date.getHours()
	let minutes = date.getMinutes()
	timePeriod = hours >= 12 ? 'PM' : 'AM'   
	hours = hours % 12
	hours = hours === 0 ? 12 : hours
	minutes = minutes >= 10 ? minutes : '0' + minutes  
	return `⏰ TT Time - ${hours}:${minutes} ${timePeriod}`
}

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
	const command = require(`./commands/${file}`)
	client.commands.set(command.name, command)
}

const cooldowns = new Discord.Collection()

client.once('ready', () => {
	console.log('Ready!')
	client.user.setActivity('Flying at the speed of light!')
	client.channels.get('608325938794725396').setName(getCurrentTime())
	const date = new Date
	const seconds = date.getSeconds()
	const remainingSecs = ((60 - seconds) * 1000)
	client.channels.get('608325938794725396').setName(getCurrentTime())
	setTimeout(() => setInterval(() => client.channels.get('608325938794725396').setName(getCurrentTime()), 60000), remainingSecs)
})

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return

	const args = message.content.slice(prefix.length).split(/ +/)
	const commandName = args.shift().toLowerCase()

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))

	if (!command) return

	if (command.guildOnly && message.channel.type !== 'text') {
		return message.reply('I can\'t execute that command inside DMs!')
	}

	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``
		}

		return message.channel.send(reply)
	}

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection())
	}

	const now = Date.now()
	const timestamps = cooldowns.get(command.name)
	const cooldownAmount = (command.cooldown || 3) * 1000

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`)
		}
	}

	timestamps.set(message.author.id, now)
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount)

	try {
		command.execute(client, message, args)
	} catch (error) {
		console.error(error)
		message.reply('Maq is stinky coding for letting his code break. Hats off to you for breaking it')
	}
})

client.login(token)