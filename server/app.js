import Express from 'express'
import exphbs from 'express-handlebars'
import logger from 'morgan'
import bodyParser from 'body-parser'
import favicon from 'serve-favicon'
import cookieParser from 'cookie-parser'
import path from 'path'

import router from './router'

const app = Express()

const hbs = exphbs.create({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.resolve(__dirname, 'views', 'layouts'),
  partialsDir: path.resolve(__dirname, 'views', 'partials')
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')

app.set('views', path.resolve(__dirname, 'views'))

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(router)
app.use((err, req, res, next) => {
  const error = new Error(404)
  res.send('error')
})

app.use(Express.static(path.resolve(__dirname, 'public')))
app.use(Express.static(path.resolve(__dirname, 'uploads')))

export default app
