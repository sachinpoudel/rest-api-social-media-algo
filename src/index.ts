import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv-safe'
import cookieParser from 'cookie-parser'
import apiRoutes from './api/api'
import { errorHandler } from './middlewares/error/error-handler'

dotenv.config()

    
const app = express()


app.use(express.json())
app.use(cookieParser())


app.use('/static', express.static('public'))

app.use('/api', apiRoutes)









// should be the last middleware
app.use(errorHandler);


export default app