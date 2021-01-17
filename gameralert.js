const axios = require('axios').default

const API_URL = 'http://localhost:999/api/v1'

const requestClient = axios.create({
    baseURL: API_URL
})

const getAllServers = async () => (await requestClient.get(`/servers`)).data

const getAllPopulatedServers = async () => (await requestClient.get('/servers/full')).data

const getServer = async (serverId) => (await requestClient.get(`/servers/${serverId}`)).data

const addServer = async (serverId) => (await requestClient.post('/servers', { id: serverId })).data

const registerUser = async(discordId, leagueName) => (await requestClient.post('/users', { discordId: discordId, leagueName: leagueName })).data

const addUserToServer = async(serverId, discordId) => (await requestClient.post(`/servers/${serverId}/users`, { discordId: discordId })).data

const updateServerWebhook = async(serverId, webhookUrl) => (await requestClient.patch(`/servers/${serverId}`, { webhook: webhookUrl })).data

const createSession = async(discordId) => (await requestClient.post(`/users/${discordId}/sessions`)).data

const addGame = async(sessionId, gameId) => (await requestClient.post(`/sessions/${sessionId}/game`, { gameId: gameId })).data

const getUserSessions = async (discordId, startDate, endDate) => {
    return (await requestClient.get(`/users/${discordId}/sessions`, { data: { startDate: startDate, endDate: endDate } })).data
}

module.exports.getServer = getServer
module.exports.getAllPopulatedServers = getAllPopulatedServers
module.exports.addServer = addServer
module.exports.registerUser = registerUser
module.exports.addUserToServer = addUserToServer
module.exports.updateServerWebhook = updateServerWebhook
module.exports.getAllServers = getAllServers
module.exports.createSession = createSession
module.exports.addGame = addGame
module.exports.getUserSessions = getUserSessions
