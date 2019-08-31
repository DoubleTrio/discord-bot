module.exports = {
    name: 'help',
    description: 'Instructions',
    aliases: ['commands'],
    execute(message) {
        message.channel.send('Testing')
    }
}