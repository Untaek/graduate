import app from './app'
import config from './config'

import mqtt from './mqtt/app'
import { couch, rdb } from './db'

app.listen(config, async () => {
  console.log('express is start')

  // couchbase test
  /*
  for (let i = 0; i < 100000; i++) {
    const doc = {
      deviceID: Math.floor(Math.random() * 100),
      ownerID: Math.floor(Math.random() * 100),
      sensorType: 'dogweight',
      measuredValue: (Math.random() * 5 + 2).toFixed(3)
    }
    couch.push(doc)
  }
  */

  // rdb test
  /*
  const connection = await rdb.transaction()
  const result1 = await rdb.query(connection, 'SELECT 1 + 4 AS QUERY3')
  const result2 = await rdb.query(connection, 'SELECT 1 + 5 AS QUERY4')
  rdb.commit(connection)

  console.log(result1.result)
  console.log(result2.result)
  */
})
