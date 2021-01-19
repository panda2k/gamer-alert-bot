const Discord = require('discord.js')
const GamerAlert = require('./gameralert')

const client = new Discord.Client()

const formatDate = date => {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-')
}

const mentionToId = mention => mention.slice(3, mention.length - 1)

const round = (number, places) => {
    let multiplier = Math.pow(10, places)

    return Math.round(number * multiplier) / multiplier
}

const stringToDate = date => {
    let startDate
    let endDate = new Date()

    if (date == 'today') {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    } else if (date == 'week') {
        startDate = new Date(endDate.getTime() - (604800 * 1000))
    } else if (date == 'month') {
        startDate = new Date(endDate.getTime() - (43800 * 60 * 1000))
    } else if (date.split('-').length == 6) {
        let splitDate = date.split('-')
        startDate = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
        endDate = new Date(splitDate[3], splitDate[4] - 1, splitDate[5])
    } else {
        throw new Error('Invalid date provided')
    }

    return [startDate, endDate]
}

const timeElapsedFromString = (startDateString, endDateString) => {
    let startDate = new Date(startDateString).getTime()
    let endDate = new Date(endDateString).getTime()

    let elapsedTime = endDate - startDate

    let minutes = Math.floor(elapsedTime / (1000 * 60))
    let seconds = Math.round((elapsedTime % (1000 * 60)) / 1000)

    return [minutes, seconds]
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
            .then(async (result) => {
                if (result.status == 201) {
                    await GamerAlert.addUserToServer(guildId, message.author.id)
                }
                message.channel.send('Registered')
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

        let userId = mentionToId(args[0])

        try {
            var [startDate, endDate] = stringToDate(args[1])
        } catch (error) {
            message.channel.send('Invalid time period. Time period can be either `today`, `week`, `month` or a custom date range like this: `2020-01-15-2020-01-26`')
            return 
        }


        await GamerAlert.getUserSessions(userId, startDate.getTime(), endDate.getTime())
            .then(result => {
                if (args[1] == 'today') {
                    message.channel.send(`<@${userId}> has logged ${result.length} sessions on ${formatDate(endDate)}`)
                } else {
                    message.channel.send(`<@${userId}> has logged ${result.length} sessions between ${formatDate(startDate)} and ${formatDate(endDate)}`)
                }
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
    } else if (command == 'gamestats') {
        if (args.length != 2) {
            message.channel.send('Missing arguments. Follow this command format: `?gamestats @personhere <time_period>`. ' + 
            "`time_period` can either be `mostrecent` (this gives the most recent game's stats), `day`, `week`, `month`, or a custom date range like this: `2020-01-15-2020-01-26`")
        }

        let userId = mentionToId(args[0])

        let startDate
        let endDate

        if (args[1] == 'mostrecent') {
            [startDate, endDate] = stringToDate('month')
        } else {
            try {
                [startDate, endDate] =  stringToDate(args[1])
            } catch (error) {
                message.channel.send('Invalid time period. Time period can be either `mostrecent`, `today`, `week`, `month` or a custom date range like this: `2020-01-15-2020-01-26`')    
                return
            }
        }

        await GamerAlert.getUserSessions(userId, startDate, endDate)
            .then(result => {
                if (result.length == 0) {
                    if (args[1] == 'today') {
                        message.channel.send(`<@${userId}> hasn't logged any games today`)
                    } else if (args[1] == 'mostrecent') {
                        message.channel.send(`<@${userId}> has no most recent game because they haven't played in over 30 days`)
                    } else {
                        message.channel.send(`<@${userId}> hasn't logged any games between ${formatDate(startDate)} and ${formatDate(endDate)}`)
                    }
                    return
                }

                let games = []
                if (args[1] == 'mostrecent') {
                    for (i = 0; i < result.length; i++) {
                        do {
                            games = [result[i].events.pop()]
                        } while (result[i].events.length > 0 && games[0].type != 'game')
                    }
                } else {
                    for (i = 0; i < result.length; i++) {
                        for (j = 0; j < result[i].events.length; j++) {
                            if (result[i].events[j].type == 'game') {
                                games.push(result[i].events[j])
                            }
                        }
                    }
                }

                for (i = 0; i < games.length; i++) {
                    let elapsedSeconds
                    let elapsedMinutes                    

                    [elapsedMinutes, elapsedSeconds] = timeElapsedFromString(games[i].startDate, games[i].endDate)

                    let embed = new Discord.MessageEmbed()
                        .setTitle(`Game Stats as ${games[i].champion}`)
                        .setDescription(`Elapsed Time: ${elapsedMinutes}:${elapsedSeconds}\n` +
                                        `CS/min: ${round(games[i].cs / (elapsedMinutes + elapsedSeconds / 60), 2)}\n` +
                                        `KDA: ${round((games[i].kills + games[i].assists) / games[i].deaths, 2)}\n\n` + 
                                        `Kills: ${games[i].kills}\nDeaths: ${games[i].deaths}\n Assists: ${games[i].assists}`
                                        )
                        .setURL(`https://www.leagueofgraphs.com/match/na/${games[i].gameId}`)
                        .setThumbnail(games[i].championImageUrl)
                        .setFooter('Missing data? This is most likely due to this game being currently played/played before Gamer Alert started saving match data.')
                    
                    message.channel.send(embed)
                }
            })
    }
    else if (command) {
        message.channel.send('Unknown command')
    }

})

client.login(process.env.GAMER_BOT_SECRET)
