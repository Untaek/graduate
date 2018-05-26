import Express from 'express'
import hbs from 'express-handlebars'
import logger from 'morgan'
import bodyParser from 'body-parser'
import favicon from 'serve-favicon'
import path from 'path'

import router from './router'

const app = Express()
app.engine(
  'hbs',
  hbs({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: path.resolve(__dirname, 'views', 'layouts')
  })
)
app.set('views', path.resolve(__dirname, 'views'))
app.set('view engine', 'hbs')
app.use(Express.static(path.resolve(__dirname, 'static')))

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(router)

export default app
