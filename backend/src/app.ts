import express from 'express'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import responsablesRoutes from './modules/responsables/responsables.routes'
import casosRoutes from './modules/casos/casos.routes'
import reportesRoutes from './modules/reportes/reportes.routes'
import { errorHandler } from './middlewares/error.handler'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/v1', authRoutes)
app.use('/api/v1', responsablesRoutes)
app.use('/api/v1', casosRoutes)
app.use('/api/v1', reportesRoutes)

app.use(errorHandler)
