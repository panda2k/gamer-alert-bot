import Router from 'express'
import nacl = require('tweetnacl')
import bodyParser = require('body-parser')
import got from 'got'
import gameralert = require('../utils/gameralert')
import { FinishedGame } from '../types/gamer_alert_interfaces'
import league = require('../utils/league')
import { DateTime } from 'luxon'

const PUBLIC_KEY = String(process.env.APPLICATION_PUBLIC_KEY)

const interactionRouter = Router()

const respondToInteraction = async(interactionId: string, interactionToken: string, data: Object) => {
    const { body } = await got.post(`https://discord.com/api/v8/interactions/${interactionId}/${interactionToken}/callback`, {
        json: {
            type: 4,
            data: data
        }
    })

    return body
}

const followupInteraction = async(interactionToken: string, data: Object) => {
    const { body } = await got.post(`https://discord.come/api/v8/webhooks/${process.env.APPLICATION_ID}/${interactionToken}`, {
        json: data,
        searchParams: {
            wait: true
        }
    })

    return body
}

const createGameEmbed = (game: FinishedGame, dataDragonVersion: string, serverTimezone: string) => {
    let gameResult: string 

    if (game.win) {
        gameResult = 'Win'
    } else {
        gameResult = 'Loss'
    }

    const gameTime = game.end_time - game.start_time
    const elapsedMinutes = Math.floor(gameTime / (1000 * 60))
    const elapsedSeconds = Math.floor(gameTime % (1000 * 60) / 1000)

    return {
        title: `Game Stats as ${game.champion} in ${game.game_type}`,
        description: `Date: ${DateTime.fromMillis(Number(game.start_time), { zone: serverTimezone }).toLocaleString(DateTime.DATETIME_FULL)}
        Game Result: ${gameResult}
        Elapsed Time: ${elapsedMinutes}:${elapsedSeconds}\n
        CS/min: ${(game.cs / (elapsedMinutes + elapsedSeconds / 60)).toFixed(2)}
        KDA: ${((game.kills + game.assists) / game.deaths).toFixed(2)}
        Kills: ${game.kills}
        Deaths: ${game.deaths}
        Assists: ${game.assists}`,
        url: `https://www.leagueofgraphs.com/match/na/${game.match_id}`,
        thumbnail: {
            url: `http://ddragon.leagueoflegends.com/cdn/${dataDragonVersion}/img/champion/${game.champion_picture}`
        }
    }
}

interactionRouter.post('', bodyParser.raw({type: 'application/json'}), async(req, res) => {
    const signature = String(req.headers['x-signature-ed25519'])
    const timestamp = req.headers['x-signature-timestamp']
    const rawBody = req.body

    const verification = nacl.sign.detached.verify(
        Buffer.from(timestamp + rawBody),
        Buffer.from(signature, 'hex'),
        Buffer.from(PUBLIC_KEY, 'hex')
    )

    if (!verification) { // needed for verification
        console.log('Failed verification')
        return res.status(401).json({'error': 'Invalid request signature'})
    }

    const data = JSON.parse(rawBody.toString())

    //console.log(JSON.stringify(data))

    if (data.type == 1) { // needed for verification
        return res.json({type: 1})
    } else if (data.data.name == 'help') {
        await respondToInteraction(data.id, data.token, {
            content: "View a list of commands by typing / and clicking the FBI badge on the left side of the popup"
        })

        return res.status(200)
    } else if (data.data.name == 'gamestats') {
        await gameralert.getGames(data.member.user.id, data.data.options[0].value, data.data.options[1].value)
            .then(async (games) => {
                if (games.length == 0) {
                    return await respondToInteraction(data.id, data.token, {
                        content: "They've logged no games in the specified time period"
                    })
                }

                let embeds: Array<Object> = []

                const dataDragonVersion = await league.getLatestDataDragonVersion()
                const serverTimezone = (await gameralert.getServer(data.guild_id)).time_zone || 'Etc/GMT'

                for (let i = 0; i < games.length; i++) {
                    embeds.push(createGameEmbed(games[i], dataDragonVersion, serverTimezone))
                }

                await respondToInteraction(data.id, data.token, {
                    embeds: embeds.slice(0, 10)
                })

                if (embeds.length >= 10) {
                    for (let i = 1; i < Math.ceil(embeds.length / 10); i++) {
                        await followupInteraction(data.token, {
                            embeds: embeds.slice(10 * i, 10 * (i + 1))
                        })
                    }
                }
            })
            .catch(async error => {
                if (error.response) {
                    console.log(error.response.body)
                } else {
                    console.log(error)
                }

                await respondToInteraction(data.id, data.token, {
                    content: 'Error when getting game data. Try again in a few seconds'
                })
            })
    } else if (data.data.name == 'timezone') {
        await gameralert.updateTimezone(data.member.user.id, data.data.options[0].value)
            .then(async() => {
                await respondToInteraction(data.id, data.token, {
                    content: `Updated server timezone to ${data.data.options[0].value}`
                })
            })
            .catch(async() => {
                await respondToInteraction(data.id, data.token, {
                    content: `Invalid timezone. Check here for a list of timezone: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`
                })
            })
    } else if (data.data.name == 'register') {
        await gameralert.createUser(data.member.user.id)
            .then(() => {
                return true
            }) 
            .catch(error => {
                if (error.response) {
                    if (error.response.body.error.includes('User with Discord id')) {
                        return true
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            })
            .then(async result => {
                if (result) {
                    await gameralert.setLeagueUsername(data.member.user.id, data.data.options[0].value)
                    .then(async() => {
                        await gameralert.addUserToServer(data.member.user.id, data.guild_id)
                            .then(async() => {
                                await respondToInteraction(data.id, data.token, {
                                    content: 'Successfully registered'
                                })
                            })
                            .catch(async error => {
                                if (error.response) {
                                    if (error.response.body.error.includes('already registered')) {
                                        return await respondToInteraction(data.id, data.token, {
                                            content: `You are already registered in this server. However, your league name was still set to ${data.data.options[0].value}`
                                        })
                                    }
                                }
                                console.log(error)
                                await respondToInteraction(data.id, data.token, {
                                    content: 'Error when registering user'
                                })
                            })
                    })
                    .catch(async error => {
                        if (error.response) {
                            await respondToInteraction(data.id, data.token, {
                                content: `Error: ${error.response.body.error}`
                            })
                        } else {
                            console.log(error)
                            await respondToInteraction(data.id, data.token, {
                                content: 'Error when setting league username'
                            })
                        }
                    })
                } else {
                    await respondToInteraction(data.id, data.token, {
                        content: 'Error when creating user'
                    })
                }

            })
    } else if (data.data.name = "timelimit") {
        await gameralert.setTimeLimit(data.member.user.id, data.data.options[0].value)
            .then(async() => {
                await respondToInteraction(data.id, data.token, {
                    content: 'Successfully changed time limit'
                })
            })
            .catch(async error => {
                console.log(error)
                await respondToInteraction(data.id, data.token, {
                    content: 'Error when updating time limit'
                })
            })
    }
})

export = interactionRouter
