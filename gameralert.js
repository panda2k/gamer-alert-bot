const axios = require('axios').default
require('dotenv').config()

const API_URL = process.env.API_URL

const requestClient = axios.create({
    baseURL: API_URL,
    headers: {'x-api-key': process.env.API_KEY || 'none'}
})

const getAllServers = async () => (await requestClient.get(`/servers`)).data

const getAllPopulatedServers = async () => (await requestClient.get('/servers/full')).data

const getServer = async (serverId) => (await requestClient.get(`/servers/${serverId}`)).data

const addServer = async (serverId) => (await requestClient.post('/servers', { id: serverId })).data

// return whole response with registerUser because the status code is important for determining whether use was updated or created
const registerUser = async(discordId, leagueName) => (await requestClient.post('/users', { discordId: discordId, leagueName: leagueName }))

const addUserToServer = async(serverId, discordId) => (await requestClient.post(`/servers/${serverId}/users`, { discordId: discordId })).data

const updateServer = async(serverId, prefix, webhookUrl, alertImageUrl) => {
    return (await requestClient.patch(
        `/servers/${serverId}`, 
        { 
            prefix: prefix, 
            webhook: webhookUrl, 
            alertImage: alertImageUrl 
        }
    )).data

}

const createSession = async(discordId) => (await requestClient.post(`/users/${discordId}/sessions`)).data

const addGame = async(sessionId, gameId) => (await requestClient.post(`/sessions/${sessionId}/game`, { gameId: gameId })).data

const getUserSessions = async (discordId, startDate, endDate) => {
    return (await requestClient.get(`/users/${discordId}/sessions`, { data: { startDate: startDate, endDate: endDate } })).data
}

const updateGame = async (sessionId, gameId, endDate, kills, deaths, assists, champion) => {
    return (await requestClient.patch(`/sessions/${sessionId}/game/${gameId}`, {
        endDate: endDate,
        kills: kills,
        deaths: deaths,
        assists: assists,
        champion: champion
    })).data
}

module.exports.getServer = getServer
module.exports.getAllPopulatedServers = getAllPopulatedServers
module.exports.addServer = addServer
module.exports.registerUser = registerUser
module.exports.addUserToServer = addUserToServer
module.exports.updateServer = updateServer
module.exports.getAllServers = getAllServers
module.exports.createSession = createSession
module.exports.addGame = addGame
module.exports.getUserSessions = getUserSessions
module.exports.updateGame = updateGame
