const Discord = require('discord.js')

const client = new Discord.Client()
const alertChannelId = process.env.OUTPUT_CHANNEL_ID
const imgLink = 'https://i.imgur.com/xGtV8Lm.png'

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('presenceUpdate', (oldMember, newMember) => {
    console.log(newMember.member.displayName)
    for (i = 0; i < newMember.activities.length; i++) {
        let currentApp = newMember.activities[i].name
        if (currentApp == 'League of Legends' || currentApp == 'VALORANT') {
            for (j = 0; j < oldMember.activities.length; j++) {
                if (oldMember.activities[j].name == 'League of Legends' || oldMember.activities[j].name == 'VALORANT') {
                    return // activity name didn't change but other metadata did
                }
            }

            client.channels.fetch(alertChannelId)
            .then(async channel => {
                await channel.send('', {files: [imgLink]})
                await channel.send(`<@${newMember.member.id}> is now ignoring his need for fresh air by playing ${currentApp}`)
            })
        }
    }
    console.log(newMember.activities)
})

client.login(process.env.GAMER_BOT_SECRET)
