import mosca from 'mosca'
import redis from 'redis'

const pubsubsettings = {
  type: 'redis',
  redis: redis,
  db: 12,
  port: 6379,
  return_buffers: true,
  host: 'localhost'
}

const settings = {
  port: 1883,
  backend: pubsubsettings,
  persistence: {
    factory: mosca.persistence.Redis
  }
}

const setup = () => {
  console.log('Mosca server is up and running')
}

const server = new mosca.Server(settings)

server.on('clientConnected', client => {
  console.log('client connected', client.id)
})

server.on('published', function(packet, client) {
  console.log('Published', packet.topic, packet.payload.toString())
})

server.on('subscribed', function(packet, client) {
  console.log('Subscribed', packet)
})

server.on('ready', setup)
