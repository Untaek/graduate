import MQTT from 'mqtt'
import handler from './handler'

const mqtt = MQTT.connect('mqtt://192.168.0.6')
handler.handle(mqtt)

export default mqtt
