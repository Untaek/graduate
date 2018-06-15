import MQTT from 'mqtt'
import _ from 'lodash'

import { couch, rdb } from '../db'

const SENSOR_VALUE = 'sensor_value'
const IDENTIFICATION = 'identification'
const SENSOR_PREFIX = 'sensor-'

const calorieNeeds = [
  { w: 2, k: 140 },
  { w: 3, k: 190 },
  { w: 4, k: 240 },
  { w: 5, k: 280 },
  { w: 6, k: 320 },
  { w: 7, k: 360 },
  { w: 8, k: 400 },
  { w: 9, k: 440 },
  { w: 10, k: 470 },
  { w: 11, k: 510 },
  { w: 12, k: 540 },
  { w: 13, k: 580 },
  { w: 14, k: 610 },
  { w: 15, k: 640 },
  { w: 16, k: 670 },
  { w: 17, k: 700 },
  { w: 18, k: 730 },
  { w: 19, k: 760 },
  { w: 20, k: 790 },
  { w: 21, k: 820 },
  { w: 22, k: 850 },
  { w: 23, k: 880 },
  { w: 24, k: 910 },
  { w: 25, k: 940 },
  { w: 26, k: 970 },
  { w: 27, k: 1000 },
  { w: 28, k: 1020 },
  { w: 29, k: 1050 },
  { w: 30, k: 1080 },
  { w: 31, k: 1100 },
  { w: 32, k: 1130 },
  { w: 33, k: 1160 },
  { w: 34, k: 1180 },
  { w: 35, k: 1210 },
  { w: 36, k: 1240 },
  { w: 37, k: 1260 },
  { w: 38, k: 1290 },
  { w: 39, k: 1310 },
  { w: 40, k: 1340 },
  { w: 41, k: 1360 },
  { w: 42, k: 1390 },
  { w: 43, k: 1410 },
  { w: 44, k: 1440 },
  { w: 45, k: 1460 },
  { w: 46, k: 1480 },
  { w: 47, k: 1510 },
  { w: 48, k: 1530 },
  { w: 49, k: 1560 }
]

const handler = () => {
  /** @param {MQTT.MqttClient} mqtt */
  const handle = mqtt => {
    const basicSub = dev => {
      if (mqtt.connected) {
        mqtt.subscribe(IDENTIFICATION)
        rdb
          .singleQuery(`SELECT serial FROM tbl_device`)
          .then(result => {
            result.forEach(pack => {
              console.log(pack.serial)
              mqtt.subscribe(SENSOR_PREFIX.concat(pack.serial))
            })
          })
          .catch(console.log)
        // For example
        if (dev) {
          setInterval(() => {
            mqtt.publish(
              SENSOR_VALUE,
              JSON.stringify({
                device_id: _.random(1, 100, false),
                meal: _.random(0, 500, true).toFixed(4),
                water: _.random(0, 500, true).toFixed(4)
              })
            )
          }, 1)
        }
      }
    }

    const listener = () => {
      basicSub()
    }

    mqtt.on('connect', listener)
    mqtt.on('message', (topic, message) => {
      const json = JSON.parse(message)
      console.log(topic)
      console.log(json)
      if (topic === IDENTIFICATION) {
        rdb
          .singleQuery(`INSERT IGNORE INTO tbl_device VALUES (?, ?)`, [
            json,
            new Date()
          ])
          .then(() => {
            mqtt.subscribe(SENSOR_PREFIX.concat(json))
          })
          .catch(console.log)
      }
      // sensor_value
      else {
        couch.push({
          device_id: topic.split('-')[1],
          meal: json.p[0] < 0 ? 0 : json.p[0],
          water: json.p[1] < 0 ? 0 : json.p[1]
        })
      }
    })
  }

  return { handle }
}

export default handler()
