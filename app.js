const Discord = require('discord.js')
const GamerAlert = require('./gameralert')

const client = new Discord.Client()

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('message', async message => {
    let guildId = message.guild.id
    let prefix;

    await GamerAlert.getServer(guildId)
        .then(result => {
            prefix = result.commandPrefix
        })
        .catch(async error => {
            if (error.response) {
                if (error.response.status == 404) {
                    await GamerAlert.addServer(guildId)
                        .then(() => {
                            prefix = '?'
                            return
                        })
                }
            }
        })

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(' ')
    const command = args.shift().toLowerCase()

    if (command == 'help') {
        message.channel.send('help message')
    } else if (command == 'register') {
        if (args.length == 0) {
            message.channel.send('Missing arguments. Follow this command format: `?register <league_name>`')
            return
        }

        await GamerAlert.registerUser(message.author.id, args[0])
            .then(async () => {
                await GamerAlert.addUserToServer(guildId, message.author.id)
                    .then(() => {
                        message.channel.send('Registered')
                    })
            })
            .catch(error => {
                if (error.response) {
                    console.log(error.response.data.error)
                    message.channel.send(error.response.data.error)
                } else {
                    message.channel.send(error)
                }
            })
    } 
    else {
        message.channel.send('Unknown command')
    }

})

client.login(process.env.GAMER_BOT_SECRET)
