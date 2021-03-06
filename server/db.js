import mysql from 'mysql'
import couchbase from 'couchbase'
import uuid from 'uuid/v1'

const initSQL = `
CREATE TABLE IF NOT EXISTS tbl_device (
  serial varchar(255) not null,
  ts timestamp default current_timestamp,
  registered bool default false,
  primary key (serial)
);
`

const initSQL2 = `
CREATE TABLE IF NOT EXISTS tbl_breed (
  id int auto_increment,
  breed varchar(20) not null,
  primary key (id)
);
`

const initSQL3 = `
CREATE TABLE IF NOT EXISTS tbl_dog (
  id bigint auto_increment,
  ts timestamp default current_timestamp,
  name varchar(100) not null,
  birth datetime not null,
  breed int not null,
  device_serial varchar(255),
  comment varchar(100),
  picture varchar(30),
  primary key (id),
  foreign key (device_serial) references tbl_device(serial),
  foreign key (breed) references tbl_breed(id)
);
`

const initSQL4 = `
CREATE TABLE IF NOT EXISTS tbl_dog_status (
  dog_id bigint,
  weight int,
  primary key (dog_id),
  foreign key (dog_id) references tbl_dog(id)
);
`

const initSQL5 = `
DELETE FROM tbl_breed;
ALTER TABLE tbl_breed AUTO_INCREMENT=1;
INSERT INTO tbl_breed (breed, minweight, maxweight) VALUES ('퍼그', 6.3, 8.5);
INSERT INTO tbl_breed (breed, minweight, maxweight) VALUES ('말티즈', 1.8, 3.2);
INSERT INTO tbl_breed (breed, minweight, maxweight) VALUES ('치와와', 1.0, 2.7);
INSERT INTO tbl_breed (breed, minweight, maxweight) VALUES ('비글', 7.0, 12.0);
INSERT INTO tbl_breed (breed, minweight, maxweight) VALUES ('골든 리트리버', 25.0, 32.0);
INSERT INTO tbl_breed (breed, minweight, maxweight) VALUES ('포메나리안', 1.4, 3.2);
INSERT INTO tbl_breed (breed, minweight, maxweight) VALUES ('진돗개', 15.0, 19.0);
INSERT INTO tbl_breed (breed, minweight, maxweight) VALUES ('닥스훈트', 6.5, 10.0);
`

class RDB {
  constructor() {
    this.mysqlPool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: 'a1234567',
      database: 'graduate',
      multipleStatements: true // development
    })
    this.singleQuery(initSQL + initSQL2 + initSQL3 + initSQL4).catch(
      console.log
    )
  }

  getConnection() {
    return new Promise((resolve, reject) => {
      this.mysqlPool.getConnection((err, connection) => {
        if (err) {
          connection.release()
          reject(err)
        }
        resolve(connection)
      })
    })
  }

  singleQuery(sql, value) {
    return new Promise((resolve, reject) => {
      this.mysqlPool.getConnection((err, connection) => {
        if (err) reject(err)
        connection.query(sql, value, (err, result) => {
          if (err) {
            connection.release()
            reject(err)
          }
          resolve(result)
          connection.release()
        })
      })
    })
  }

  query(connection, sql, value) {
    return new Promise((resolve, reject) => {
      connection.query(sql, value, (err, result) => {
        if (err) {
          return connection.rollback(() => {
            connection.release()
            reject(err)
          })
        }
        resolve({ connection, result })
      })
    })
  }

  commit(conn) {
    conn.commit(err => {
      if (err) {
        return conn.rollback(() => {
          connection.release()
          throw err
        })
      }
      conn.release()
    })
  }

  transaction() {
    return new Promise((resolve, reject) => {
      this.mysqlPool.getConnection((err, conn) => {
        conn.beginTransaction(err => {
          if (err) {
            return conn.rollback(err => {
              connection.release()
              reject(err)
            })
          }
          resolve(conn)
        })
      })
    })
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
    this.bucket.query(
      this.N1qlQuery.fromString(
        'select device_id, measured_value, sensor_type, time_stamp from sensor where owner_id=101 limit 20'
      ),
      (a, b, c) => {
        if (a) console.log(a)
      }
    )
  }

  init() {
    const bucket = this.bucket
  }

  push(packet) {
    const bucket = this.bucket
    const id = uuid()
    bucket.insert(
      id, // key (uuid)
      packet,
      (err, result) => {
        bucket.get(id, (err, result) => {
          console.log('Inserted into couchbase\n', result)
        })
      }
    )
  }

  query(sql, params) {
    return new Promise((resolve, reject) => {
      this.bucket.query(
        this.N1qlQuery.fromString(sql),
        params,
        (err, result) => {
          if (err) reject(err)
          resolve(result)
        }
      )
    })
  }
}

export const rdb = new RDB()
export const couch = new NoSQL()
