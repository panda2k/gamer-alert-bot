const axios = require('axios').default

const API_URL = 'http://localhost:999/api/v1'

const requestClient = axios.create({
    baseURL: API_URL
})

const getServer = async (serverId) => (await requestClient.get(`/servers/${serverId}`)).data

const addServer = async (serverId) => (await requestClient.post('/servers', { id: serverId })).data

const registerUser = async(discordId, leagueName) => (await requestClient.post('/users', { discordId: discordId, leagueName: leagueName })).data

const addUserToServer = async(serverId, discordId) => (await requestClient.post(`/servers/${serverId}/users`, { discordId: discordId })).data

module.exports.getServer = getServer
module.exports.addServer = addServer
module.exports.registerUser = registerUser
module.exports.addUserToServer = addUserToServer
