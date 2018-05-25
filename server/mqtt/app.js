import MQTT from 'mqtt'

const mqtt = MQTT.connect('mqtt://192.168.0.6')
mqttHandler.handle(mqtt)
