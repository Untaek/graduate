import MQTT from 'mqtt'
import _ from 'lodash'
import cron from 'cron'

import { couch, rdb } from '../db'

const SENSOR_VALUE = 'sensor_value'
const IDENTIFICATION = 'identification'
const SENSOR_PREFIX = 'sensor-'
const TARGET_PREFIX = 'target-'

const recommendMeal = [
  { w: 2, m: 50 },
  { w: 5, m: 100 },
  { w: 10, m: 150 },
  { w: 15, m: 190 },
  { w: 20, m: 240 },
  { w: 30, m: 320 }
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
              mqtt.subscribe(SENSOR_PREFIX.concat(pack.serial))
            })
          })
          .catch(console.log)
        // For example
        if (dev) {
          mqtt.subscribe(SENSOR_VALUE)
          setInterval(() => {
            mqtt.publish(
              SENSOR_VALUE,
              JSON.stringify({
                device_id: '931124',
                meal: _.random(0, 500, true).toFixed(4),
                water: _.random(0, 500, true).toFixed(4),
                weight: _.random(4.3, 4.8, true).toFixed(4),
                time_stamp: Date.now()
              })
            )
          }, 100)
        }
      }
    }

    const listener = async () => {
      basicSub()
      const job = new cron.CronJob({
        cronTime: '00 00 10 * *',
        start: false,
        timeZone: 'Asia/Seoul',
        onTick: async () => {
          try {
            const meta = await rdb.singleQuery(`SELECT serial FROM tbl_device`)
            if (meta.length) {
              meta.forEach(async data => {
                const serial = data.serial
                const meals = await couch.query(
                  `SELECT meal, weight FROM sensor 
                    WHERE device_id = '${serial}'
                    ORDER BY time_stamp DESC
                    LIMIT 1
                    `
                )
                if (meals.length) {
                  const weight = meals[0].weight
                  const currentMeal = meals[0].meal

                  const apx = recommendMeal
                    .map(ele => {
                      return Math.abs(ele.w - weight)
                    })
                    .reduce(
                      (acc, cur, i) => {
                        return acc.diff < cur
                          ? { index: acc.index, diff: acc.diff }
                          : { index: i, diff: cur }
                      },
                      { index: 0, diff: Number.MAX_SAFE_INTEGER }
                    )

                  const control = recommendMeal[apx.index]
                  const weightRatio = weight / control.w

                  const target = control.m * weightRatio - currentMeal

                  console.log(target)

                  if (target > 0) {
                    mqtt.publish(
                      TARGET_PREFIX.concat(serial),
                      JSON.stringify({
                        meal: control.m * weightRatio
                      })
                    )
                  }
                }
              })
            }
          } catch (e) {
            console.log(e)
          }
        }
      })

      //job.start()
    }

    mqtt.on('connect', listener)
    mqtt.on('message', (topic, message) => {
      const json = JSON.parse(message)
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
        /** DEV */
        //couch.push(json)
        const doc = {
          device_id: topic.split('-')[1],
          meal: json.p[0] < 0 ? 0 : json.p[0],
          water: json.p[1] < 0 ? 0 : json.p[1],
          weight: json.p[2] < 0 ? 0 : json.p[2],
          date: new Date().getTime()
        }

        doc.weight = doc.weight / 1000

        couch.push(doc)
      }
    })
  }

  return { handle }
}

export default handler()
