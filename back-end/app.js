import express from 'express';
import axios from 'axios' ;
import dotenv from 'dotenv' ;
import morgan from 'morgan';
import router from "./src/routes/index.js";

dotenv.config({ silent: true });

const app = express()

// middleware
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// mount all API routes under "/api"
app.use("/api", router);


export default app;