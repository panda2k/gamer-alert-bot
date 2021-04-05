const server = require('./app')
const port = process.env.PORT || 7777

server.listen(port, () => {
    console.log(`Now listening on port ${port}`)
})

