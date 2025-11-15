import express from 'express'
import axios from 'axios' 
import dotenv from 'dotenv' 
import morgan from 'morgan'
import router from "./src/routes/index.js"
import homeRouter from './src/routes/homeRoutes.js'
import cors from "cors"

dotenv.config({ silent: true })

const app = express()

// middleware
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors({
  origin: "http://localhost:3000", // replace/ add deployed link
  methods: ["GET", "POST"],
  credentials: true, 
}));

// mount all API routes under "/api"
app.use("/api", router)




export default app;