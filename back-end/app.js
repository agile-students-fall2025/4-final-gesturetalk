require('dotenv').config({ silent: true }) 
const morgan = require('morgan') 
const cors = require('cors') 
const mongoose = require('mongoose')

const app = express()

app.use(cors())





module.exports = app