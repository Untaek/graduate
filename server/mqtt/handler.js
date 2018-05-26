import MQTT from 'mqtt'
import _ from 'lodash'

import { couch } from '../db'

const SENSOR_VALUE = 'sensor_value'
const IDENTIFICATION = 'identification'

const handler = () => {
  /** @param {MQTT.MqttClient} mqtt */
  const handle = mqtt => {
    const basicSub = () => {
      if (mqtt.connected) {
        mqtt.subscribe(IDENTIFICATION)
        mqtt.subscribe(SENSOR_VALUE)
        // For example
        setInterval(() => {
          mqtt.publish(
            SENSOR_VALUE,
            JSON.stringify({
              device_id: _.random(1, 100, false),
              owner_id: _.random(1000, 2000, false),
              sensor_type: 'weight',
              measured_value: _.random(2, 15, true).toFixed(4)
            })
          )
        }, 2)
      }
    }

    const listener = () => {
      basicSub()
    }

    mqtt.on('connect', listener)
    mqtt.on('message', (topic, message) => {
      console.log('on message:', topic, message.toString())
      const json = JSON.parse(message)
      let obj = {}
      console.log(json)
      switch (topic) {
        case SENSOR_VALUE:
          obj = {
            deviceID: json.device_id,
            ownerID: json.owner_id,
            sensorType: json.sensor_type,
            measuredValue: json.measured_value
          }
          couch.push(obj)
          break
        case IDENTIFICATION:
          obj = {
            deviceID: json.device_id
          }
          break
        default:
          break
      }
    })
  }

  return { handle }
}

export default handler()
