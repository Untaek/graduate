import MQTT from 'mqtt'

const handler = () => {
  /** @param {MQTT.MqttClient} mqtt */
  const handle = mqtt => {
    const basicSub = () => {
      if (mqtt.connected) {
        mqtt.subscribe('identification')
        mqtt.subscribe('sensor_value')
      }
    }

    const listener = () => {
      basicSub()
    }

    mqtt.on('connect', listener)
    mqtt.on('message', function(topic, message) {
      console.log(message.toString() + 'hahaha')
      mqtt.end()
    })
  }

  return { handle }
}

export default handler()
