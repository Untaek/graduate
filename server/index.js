import app from './app'
import config from './config'

app.listen(config, () => {
  console.log('express is start')
})
