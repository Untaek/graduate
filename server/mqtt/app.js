import MQTT from 'mqtt'
import handler from './handler'

const mqtt = MQTT.connect('mqtt://192.168.0.16')
handler.handle(mqtt)

export default mqtt
