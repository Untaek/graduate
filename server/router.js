import Express from 'express'

import { rdb } from './db'

const router = Express.Router()

router.get('/', async (req, res) => {
  const serial = req.cookies.serial
  const SQL = `
    SELECT id, ts, name, birth, category 
    FROM tbl_dog WHERE device_serial = ?
  `

  try {
    const result = await rdb.singleQuery(SQL, serial)
    console.log(result)
    res.render('index', { serial: serial, dogs: result })
  } catch (e) {
    console.log(e)
  }
})

router
  .route('/register')
  .get(async (req, res) => {
    res.render('register')
  })
  .post(async (req, res) => {
    const SQL = `INSERT INTO tbl_device 
    (serial) VALUES (?)`
    const serial = req.body.serial
    try {
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
