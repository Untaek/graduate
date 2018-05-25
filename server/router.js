import Express from 'express'

const router = Express.Router()

router.get('/', (req, res) => {
  res.render('index', { title: 'Heeyeon', array: [1, 2, 3, 4, 5] })
})

export default router
