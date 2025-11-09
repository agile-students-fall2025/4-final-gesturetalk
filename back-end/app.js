import express from 'express'
const app = express()
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import multer from 'multer' 
import axios from 'axios' 
import dotenv from 'dotenv' 
dotenv.config({ silent: true })
import morgan from 'morgan'

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// Sign In
app.get('/', (req, res) => {
  
})

app.post('/', (req, res) => {

})

// Sign Up
app.get('/signup', (req, res) => {
  
})

app.post('/signup', (req, res) => {
    
})

// Call History
app.get('/call-history', (req, res) => {
  
})

app.post('/call-history', (req, res) => {
    
})

// Home
app.get('/home', (req, res) => {
  
})

app.post('/home', (req, res) => {
    
})

// multer for user upload profile image:
const storage = multer.diskStorage({
    // populate here, see knowledge kitchen example code
})
const upload = multer({ storage })

// Proflile
app.get('/profile', (req, res) => {
  
})

app.post('/profile', (req, res) => {
    
})

// Meeting

app.get('/meeting/:meetingId', (req, res) => {
  
})

app.post('/meeting/:meetingId', (req, res) => {
})

app.post("end-meeting/:meetingId", (req, res) => {
  
})

// Translation log
app.get('/translation-log/:meetingId', (req, res) => {
  
})

app.post('/translation-log/:meetingId', (req, res) => {
    
})


export default app