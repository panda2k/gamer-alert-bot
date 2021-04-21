import Router from 'express'
import nacl = require('tweetnacl')
import bodyParser = require('body-parser')
import got from 'got'

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

    console.log(data)

    if (data.type == 1) { // needed for verification
        return res.json({type: 1})
    } else if (data.data.name == 'help') {
        await respondToInteraction(data.id, data.token, {
            content: "IT WORKED!!!"
        })

        return res.status(200)
    } else if (data.data.name == 'gamestats') {
        
    }
})

export = interactionRouter
