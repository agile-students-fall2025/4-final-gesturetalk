import express from 'express'
import axios from 'axios' 
import dotenv from 'dotenv' 
import morgan from 'morgan'
import router from "./src/routes/index.js"
import homeRouter from './src/routes/homeRoutes.js'


dotenv.config({ silent: true })

const app = express()

// middleware
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// mount all API routes under "/api"
app.use("/api", router)

app.listen(5000, () => console.log('Server running on port 5000'));


export default app;