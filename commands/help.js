module.exports = {
    name: 'help',
    description: 'Commands',
    aliases: ['commands'],
    execute(message) {
        message.channel.send('Testing')
    }
}