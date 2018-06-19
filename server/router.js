import Express from 'express'
import _ from 'lodash'
import multer from 'multer'

import { rdb, couch } from './db'

const DEMO = true

const router = Express.Router()
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/')
  },
  filename: (req, file, cb) => {
    cb(
      null,
      req.cookies.serial +
        '_' +
        new Date()
          .toTimeString()
          .split(' ')
          .join('_') +
        '.jpg'
    )
  }
})
const upload = multer({ storage })

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
    SELECT tbl_dog.id AS id, ts, name, birth, tbl_breed.breed AS breed, comment, picture
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
          const weight = await couch.query(
            `SELECT weight FROM sensor 
              WHERE device_id = '${serial}' 
              LIMIT 5`,
            serial
          )
          console.log(weight)
          ele.weight = weight.reduce((acc, cur) => {
            return acc + Number.parseFloat(cur.weight) / weight.length
          }, 0)
          console.log(ele.weight)
          return ele
        })

        Promise.all(promise).then(returnVal => {
          result = returnVal.map(dog => {
            dog.weight =
              dog.weight > 0 ? Number.parseFloat(dog.weight.toFixed(2)) : 0
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

router.get('/information', async (req, res) => {
  res.render('information')
})

router.get('/graph', async (req, res) => {
  const serial = req.cookies.serial
  console.log('/graph', serial)
  const SQL = `
    SELECT serial FROM tbl_device WHERE serial = ?
  `

  if (serial) {
    try {
      const meta = await rdb.singleQuery(SQL, serial)
      if (meta.length) {
        const device_id = meta[0].serial
        const sensorQuery = `
          SELECT meal, water, weight, time_stamp 
          FROM sensor WHERE device_id = '${device_id}'
          ORDER BY time_stamp DESC
          LIMIT 100`

        let result = await couch.query(sensorQuery)
        result = result.reduce(
          (a, b, i, arr) => {
            const today = new Date()
            const date = new Date(b.time_stamp)
            const day = date.getDay()
            const weekStart =
              Date.now() -
              today.getDay() * 24 * 60 * 60 * 1000 -
              today.getHours() * 60 * 60 * 1000 -
              today.getMinutes() * 60 * 1000

            if (date.getTime() > weekStart) {
              a[day].weight += Number.parseFloat(b.weight) / result.length
              if (i != arr.length - 1) {
                const beforeMeal = Number.parseFloat(arr[i].meal)
                const afterMeal = Number.parseFloat(arr[i + 1].meal)
                a[day].meal +=
                  beforeMeal > afterMeal ? beforeMeal - afterMeal : 0
                const beforeWater = Number.parseFloat(arr[i].water)
                const afterWater = Number.parseFloat(arr[i + 1].water)
                a[day].water +=
                  beforeWater > afterWater ? beforeWater - afterWater : 0
              }
            }
            return a
          },
          // 7 days
          _.times(7, () => {
            return { weight: 0, meal: 0, water: 0 }
          })
        )

        result.forEach(ele => {
          ele.meal = ele.meal * 3
        })

        res.json(result)
      }
    } catch (e) {
      console.log(e)
    }
  } else {
    res.json([])
  }
})

router.post('/dog', upload.single('picture'), async (req, res) => {
  const dog = req.body
  const serial = req.cookies.serial
  const SQL = `
    INSERT INTO tbl_dog (name, birth, breed, device_serial, comment, picture)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  const filename = req.file ? req.file.filename : ''

  if (serial) {
    console.log(dog, serial)
    try {
      const result = await rdb.singleQuery(SQL, [
        dog.name,
        new Date(dog.birth),
        Number.parseInt(dog.breed),
        serial,
        dog.comment,
        filename
      ])
      console.log(result)
      if (result) {
        res.redirect('/')
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
        const sensorQuery = `
        SELECT * FROM sensor 
        WHERE device_id = '${device_id}'
        LIMIT 1000`

        couch
          .query(sensorQuery)
          .then(result => {
            res.render('health', { data: result })
          })
          .catch(console.log)
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
      UPDATE tbl_device
      SET registered = 1
      WHERE serial = ?
    `
    const duplCheckSQL = `
      SELECT registered FROM tbl_device
      WHERE serial = ?      
    `

    if (DEMO) {
      res.cookie('serial', serial, {
        httpOnly: true,
        expires: new Date(Date.now() + 1000000000000)
      })
      res.redirect('/')
      return
    }

    try {
      const duplCheck = await rdb.singleQuery(duplCheckSQL, serial)
      if (duplCheck.length == 0) {
        res.render('register', { notFound: true })
        return
      } else if (duplCheck[0].registered) {
        res.render('register', { duplicate: true })
        return
      }

      await rdb.singleQuery(SQL, serial)
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
