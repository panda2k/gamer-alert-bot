const Discord = require('discord.js')
const GamerAlert = require('./gameralert')

const client = new Discord.Client()

let formatDate = date => {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-')
}

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

    if (message.content.indexOf('?') != message.content.lastIndexOf('?')) return;

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
                    message.channel.send(error.response.data.error)
                } else {
                    message.channel.send(error)
                }
            })
    } else if (command == 'sessions') {
        // format: ?sessions <discordMention> <timePeriod>
        if (args.length < 2) {
            message.channel.send('Missing arguments. Follow this command format: `?sessions @personhere <timePeriod>`.' + 
                                'Time period can be either `today`, `week`, `month` or a custom date range like this: `2020-01-15-2020-01-26`')
            return 
        }

        let userId = args[0].slice(3, args[0].length - 1)
        let startDate
        let endDate = new Date()

        if (args[1] == 'today') {
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        } else if (args[1] == 'week') {
            startDate = new Date(endDate.getTime() - (604800 * 1000))
        } else if (args[1] == 'month') {
            startDate = new Date(endDate.getTime() - (43800 * 60 * 1000))
        } else if (args[1].split('-').length == 6) {
            let splitDate = args[1].split('-')
            startDate = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
            endDate = new Date(splitDate[3], splitDate[4] - 1, splitDate[5])
        } else {
            message.channel.send('Invalid time period. Time period can be either `today`, `week`, `month` or a custom date range like this: `2020-01-15-2020-01-26`')
            return
        }

        await GamerAlert.getUserSessions(userId, startDate.getTime(), endDate.getTime())
            .then(result => {
                message.channel.send(`<@${userId}> has logged ${result.length} sessions between ${formatDate(startDate)} and ${formatDate(endDate)}`)
            })
            .catch(error => {
                if (error.response) {
                    message.channel.send(error.response.data.error)
                } else {
                    message.channel.send(error)
                }
            })
    } else if (command == 'alertimage') {
        if (args.length != 1) {
            message.channel.send('Invalid arguments. Correct format: ?alertimage <image_url>')
            return
        }

        if (args[0] == 'none') {
            args[0] = ' '
        }

        await GamerAlert.updateServer(guildId, null, null, args[0])
            .then(() => {
                message.channel.send('Successfully updated alert image url')
            })
            .catch (error => {
                if (error.response) {
                    message.channel.send(error.response.data.error)
                } else {
                    message.channel.send(error)
                }
            })
    }
    else if (command) {
        message.channel.send('Unknown command')
    }

})

client.login(process.env.GAMER_BOT_SECRET)
