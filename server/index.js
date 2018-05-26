import app from './app'
import config from './config'

import mqtt from './mqtt/app'
import { couch } from './db'

app.listen(config, () => {
  console.log('express is start')
  /*for (let i = 0; i < 100000; i++) {
    const doc = {
      deviceID: Math.floor(Math.random() * 100),
      ownerID: Math.floor(Math.random() * 100),
      sensorType: 'dogweight',
      measuredValue: (Math.random() * 5 + 2).toFixed(3)
    }
    couch.push(doc)
  }*/
})
