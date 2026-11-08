import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../common/ApiError'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message })
  }
  console.error(err)
  return res.status(500).json({ error: 'Error interno del servidor.' })
}
