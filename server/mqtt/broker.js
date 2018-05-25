import mosca from 'mosca'

const pubsubsettings = {
  type: 'mongo',
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'dog',
  mongo: {}
}

const settings = {
  port: 1883,
  backend: pubsubsettings
}

const setup = () => {
  console.log('Mosca server is up and running')
}

const server = new mosca.Server(settings)

server.on('clientConnected', client => {
  console.log('client connected', client.id)
})

server.on('published', function(packet, client) {
  console.log('Published', packet.payload)
})

server.on('subscribed', function(packet, client) {
  console.log('Subscribed', packet, client.id)
})

server.on('ready', setup)
