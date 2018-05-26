import mysql from 'mysql'
import couchbase from 'couchbase'
import uuid from 'uuid/v1'

class RDB {
  constructor() {
    this.mysqlPool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'a1234567',
      database: 'graduate'
    })
  }

  getConnection() {
    return new Promise((resolve, reject) => {
      this.mysqlPool.getConnection((err, connection) => {
        if (err) reject(err)
        resolve(connection)
      })
    })
  }

  async transaction() {
    const connection = await this.getConnection()
  }
}

class NoSQL {
  constructor() {
    this.couchbase = couchbase
    this.url = 'couchbase://localhost/'
    this.bucketName = 'sensor'
    this.cluster = new this.couchbase.Cluster(this.url)
    this.cluster.authenticate('untaek', 'a1234567')
    this.bucket = this.cluster.openBucket(this.bucketName)
    this.N1qlQuery = couchbase.N1qlQuery
  }

  init() {
    const bucket = this.bucket
  }

  push({ deviceID, ownerID, sensorType, measuredValue }) {
    const bucket = this.bucket
    const id = uuid()
    bucket.insert(
      id, // key (uuid)
      {
        device_id: deviceID,
        owner_id: ownerID,
        sensor_id: sensorType,
        measured_value: measuredValue,
        time_stamp: new Date()
      },
      (err, result) => {
        bucket.get(id, (err, result) => {
          console.log('Inserted into couchbase\n', result.value)
        })
      }
    )
  }
}

export const rdb = new RDB()
export const couch = new NoSQL()
