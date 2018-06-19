import MQTT from 'mqtt'
import handler from './handler'

const mqtt = MQTT.connect('mqtt://localhost')
handler.handle(mqtt)

export default mqtt
