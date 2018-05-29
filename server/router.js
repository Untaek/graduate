import Express from 'express'
import _ from 'lodash'

import { rdb, couch } from './db'

const router = Express.Router()

const getMonthAge = birthday => {
  const now = new Date()
  const birth = new Date(birthday)
  return (
    (now.getFullYear() - birth.getFullYear()) * 12 +
    now.getMonth() -
    birth.getMonth()
  )
}

router.get('/', async (req, res) => {
  const serial = req.cookies.serial
  const SQL = `
    SELECT tbl_dog.id AS id, ts, name, birth, tbl_breed.breed AS breed, comment
    FROM tbl_dog
    INNER JOIN tbl_breed ON tbl_dog.breed = tbl_breed.id
    WHERE device_serial = ?
  `
  if (serial) {
    try {
      let result = await rdb.singleQuery(SQL, serial)
      if (result.length) {
        const promise = _.map(result, async ele => {
          ele.monthAge = getMonthAge(ele.birth)
          ele.weight = await couch.query(
            `SELECT measured_value FROM sensor 
              WHERE device_id = '${serial}' 
              AND sensor_type = 'weight' 
              LIMIT 1`,
            serial
          )
          return ele
        })

        Promise.all(promise).then(returnVal => {
          result = returnVal.map(dog => {
            dog.weight = dog.weight.length ? dog.weight[0].measured_value : 0
            return dog
          })
          console.log(result)
          res.render('index', { serial: serial, dogs: result })
        })
      } else {
        res.render('index', { serial: serial, dogs: null })
      }
    } catch (e) {
      console.log(e)
    }
  } else {
    res.redirect('register')
  }
})

router.post('/dog', async (req, res) => {
  const dog = req.body
  const serial = req.cookies.serial
  const SQL = `
    INSERT INTO tbl_dog (name, birth, breed, device_serial)
    VALUES (?, ?, ?, ?)
  `

  if (serial) {
    console.log(dog, serial)
    try {
      const result = await rdb.singleQuery(SQL, [
        dog.name,
        new Date(dog.birth),
        Number.parseInt(dog.breed),
        serial
      ])
      console.log(result)
      if (result) {
        res.render('index')
      }
    } catch (e) {
      console.log(e)
    }
  } else {
    res.redirect('register')
  }
})

router.get('/health', async (req, res) => {
  const serial = req.cookies.serial

  // test case
  const SQL = `
    SELECT serial FROM tbl_device WHERE serial = ?
  `

  if (serial) {
    try {
      const result = await rdb.singleQuery(SQL, serial)
      if (result.length) {
        const device_id = result[0].serial
        const sensorQuery = couch.N1qlQuery.fromString(
          `SELECT * FROM sensor WHERE device_id = ${device_id}
           LIMIT 1000`
        )
        couch.bucket.query(sensorQuery, (err, result) => {
          if (err) throw err
          res.render('health', { data: result })
        })
      }
    } catch (e) {
      console.log(e)
    }
  } else {
    res.render('health', { data: null })
  }
})

router.get('/question', async (req, res) => {
  res.render('question')
})
router.get('/setting', async (req, res) => {
  res.render('setting')
})
router.get('/newbie', async (req, res) => {
  res.render('newbie')
})
router
  .route('/register')
  .get(async (req, res) => {
    const serial = req.cookies.serial
    res.render('register', { serial })
  })
  .post(async (req, res) => {
    const serial = req.body.serial
    const SQL = `
      INSERT INTO tbl_device 
      (serial) VALUES (?)
    `
    const duplCheckSQL = `
      SELECT * FROM tbl_device
      WHERE serial = ?      
    `
    try {
      const duplCheck = await rdb.singleQuery(duplCheckSQL, serial)
      if (duplCheck.length > 0) {
        res.render('register', { duplicate: true })
        return
      }

      const result = await rdb.singleQuery(SQL, serial)
      res.cookie('serial', serial, {
        httpOnly: true,
        expires: new Date(Date.now() + 1000000000000)
      })
      res.redirect('/')
    } catch (e) {
      console.log(e)
    }
  })

export default router
