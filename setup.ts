import got from 'got'
require('dotenv').config()

const BASE_URL = `https://discord.com/api/v8/applications/${process.env.APPLICATION_ID}/commands`

const commands = [
    {
        "name": "help",
        "description": "View a list of Gamer Alert commands"
    }
];


(async() => {
    for (let i = 0; i < commands.length; i++) {
        const { body } = await got.post(BASE_URL, {
            json: commands[i],
            responseType: 'json',
            headers: { 'Authorization': `Bot ${process.env.BOT_TOKEN}` }
        })

        console.log(body)
    }
})()
